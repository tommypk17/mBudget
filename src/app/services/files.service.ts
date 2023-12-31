import {inject, Injectable} from '@angular/core';
import {AuthService} from "../authentication/services/auth.service";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {IBillSchema, IBudgetSchema, IFileSearch, IFileSearchDetails} from "../models/driveSchema.model";
import FileResource = gapi.client.drive.FileResource;
import {combineLatest, map, Observable} from "rxjs";
import {ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot} from "@angular/router";
import {ConfirmationService, ConfirmEventType} from "primeng/api";

export const DriveConfig = {
  BILL_FILE_NAME: '.bills',
  BUDGET_FILE_NAME: '.budgets'
}

export const FileGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
  return inject(FilesService).canActivate(next, state);
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(private authService: AuthService, private http: HttpClient, private confirmationService: ConfirmationService) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolver) => {
      let billFileId = sessionStorage.getItem(DriveConfig.BILL_FILE_NAME);
      let budgetFileId = sessionStorage.getItem(DriveConfig.BUDGET_FILE_NAME);
      if(billFileId && budgetFileId) {
        return resolver(true);
      }
      combineLatest({
        bill: this.findFileId(DriveConfig.BILL_FILE_NAME),
        budget: this.findFileId(DriveConfig.BUDGET_FILE_NAME)
      }).pipe(
        map((combine) => {
          if(combine.bill && combine.budget) {
            sessionStorage.setItem(DriveConfig.BILL_FILE_NAME, combine.bill);
            sessionStorage.setItem(DriveConfig.BUDGET_FILE_NAME, combine.budget);
            return resolver(true);
          }
          console.log(combine.bill)
          if(!combine.bill) {
            this.createBillFile();
          }
          if(!combine.budget){
            this.createBudgetFile();
          }
          return resolver(false);
        })).subscribe(() => {});
    });
  }

  private createBillFile(): void {
    this.confirmationService.confirm({
      message: 'To continue, we will create a file to store bills in your personal Google Drive. Create file?',
      header: 'Bill file required',
      icon: 'pi pi-exclamation-triangle',
      key: 'noBillsConfirmation',
      accept: () => {
        let newFile: IBillSchema = {bills: [], payees: [], income: [], balances: []};
        this.createFile(DriveConfig.BILL_FILE_NAME, newFile).subscribe((file) => {
          location.reload();
        });
      },
      reject: (type: ConfirmEventType) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            break;
          case ConfirmEventType.CANCEL:
            break;
        }
      }
    });
  }

  private createBudgetFile(): void {
    this.confirmationService.confirm({
      message: 'To continue, we will create a file to store budgets in your personal Google Drive. Create file?',
      header: 'File required',
      icon: 'pi pi-exclamation-triangle',
      key: 'noBillsConfirmation',
      accept: () => {
        let newFile: IBudgetSchema = {
          budgets: [{
            name: 'Primary',
            income: {
              net: 0,
              gross: 0
            },
            debt: 0,
            need: [],
            want: [],
            extra: [],
            breakdown: {
              need: {
                planned: 50
              },
              want: {
                planned: 30
              },
              extra: {
                planned: 20
              }
            }
          }]
        };
        this.createFile(DriveConfig.BUDGET_FILE_NAME, newFile).subscribe((file) => {
          location.reload();
        });
      },
      reject: (type: ConfirmEventType) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            break;
          case ConfirmEventType.CANCEL:
            break;
        }
      }
    });
  }

  get files(): Observable<IFileSearch>{
    return this.listAppDataFiles();
  }

  retrieveFile<T>(sessionStorageKey: string): Observable<T | undefined> {
    return new Observable((subscriber) => {
      let sessionFile = sessionStorage.getItem(sessionStorageKey);
      if(!sessionFile) {
        subscriber.next(undefined);
        return;
      }
      let file = JSON.parse(sessionFile) as T;
      subscriber.next(file);
    });
  }

  getFile<T>(id: string): Observable<T | undefined> {
    let query: HttpParams = new HttpParams();
    query = query.append('alt', 'media')
    query = query.append('spaces', 'appDataFolder')

    let uri = `https://www.googleapis.com/drive/v3/files/${id}`

    return this.http.get<any>(uri, {params: query});
  }

  createFile(name: string, content: any, parents: string[] = []): Observable<FileResource> {
      let query: HttpParams = new HttpParams();
      query = query.append('uploadType', 'multipart');
      let headers: HttpHeaders = new HttpHeaders();
      headers = headers.append('Content-Type', 'multipart/related; boundary="ax100"');
      parents = [...parents, 'appDataFolder'];

      let body = '';
      body = body + '--ax100\n';
      body = body + 'Content-Type: application/json; charset=UTF-8';
      body = body + '\n\n';
      body = body + JSON.stringify({name: name, parents: parents});
      body = body + '\n\n';
      body = body + '--ax100\n';
      body = body + 'Content-Type: application/json';
      body = body + '\n\n';
      body = body + JSON.stringify(content);
      body = body + '\n\n';
      body = body + '--ax100--';

      let uri = `https://www.googleapis.com/upload/drive/v3/files`;
      return this.http.post<FileResource>(uri, body,{params: query, headers: headers});
  }

  updateFile(id: string, contents: any): Observable<FileResource> {
    let query: HttpParams = new HttpParams();
    query = query.append('uploadType', 'media');

    let body = contents;

    let uri = `https://www.googleapis.com/upload/drive/v3/files/${id}`;
    return this.http.patch<FileResource>(uri, body,{params: query}).pipe(map((res) => {
      sessionStorage.setItem(id, JSON.stringify(contents));
      return res;
    }));
  }

  saveFile(id: string, contents: any): Observable<FileResource> {
    let query: HttpParams = new HttpParams();
    query = query.append('uploadType', 'media');

    let body = contents;

    let uri = `https://www.googleapis.com/upload/drive/v3/files/${id}`;
    return this.http.patch<FileResource>(uri, body,{params: query}).pipe(map((res) => {
      sessionStorage.setItem(id, contents);
      return res;
    }));
  }

  deleteFile(id: string): Observable<boolean> {
    let query: HttpParams = new HttpParams();
    query = query.append('spaces', 'appDataFolder')

    let uri = `https://www.googleapis.com/drive/v3/files/${id}`
    return this.http.delete<any>(uri, {params: query}).pipe(map((res) => {
      let billFileId = sessionStorage.getItem(DriveConfig.BILL_FILE_NAME);
      if(billFileId){
        sessionStorage.removeItem(DriveConfig.BILL_FILE_NAME);
        sessionStorage.removeItem(billFileId);
      }
      let budgetFileId = sessionStorage.getItem(DriveConfig.BUDGET_FILE_NAME);
      if(budgetFileId){
        sessionStorage.removeItem(DriveConfig.BUDGET_FILE_NAME);
        sessionStorage.removeItem(budgetFileId);
      }
      return res;
    }))
  }

  listAppDataFiles(): Observable<IFileSearch> {
    let query: HttpParams = new HttpParams();
    query = query.append('spaces', 'appDataFolder')

    let uri = `https://www.googleapis.com/drive/v3/files`
    return this.http.get<IFileSearch>(uri, {params: query});
  }

  listAppDataFilesDetails(): Observable<IFileSearchDetails> {
    let query: HttpParams = new HttpParams();
    query = query.append('spaces', 'appDataFolder')
    query = query.append('fields', 'files(id,name,kind,size,mimeType,size,createdTime,modifiedTime)')

    let uri = `https://www.googleapis.com/drive/v3/files`

    return this.http.get<IFileSearchDetails>(uri, {params: query})
  }

  private findFolder(name: string): Promise<FileResource | undefined> {
    return new Promise<FileResource | undefined>((resolver) => {
      let query: HttpParams = new HttpParams();
      let search = "mimeType='application/vnd.google-apps.folder'"
      search = search + " and "
      search = search + `name='${name}'`
      query = query.append('q', search)
      query = query.append('spaces', 'appDataFolder')
      let uri = `https://www.googleapis.com/drive/v3/files`;
      this.http.get<IFileSearch>(uri,{params: query}).subscribe((res) => {
        if(res && res.files.length > 0){
          resolver(res.files[0]);
        }else resolver(undefined);
      })
    });
  }

  private createFolder(name: string, parents: string[] = []): Promise<FileResource> {
    let query: HttpParams = new HttpParams();
    let schema = {
      name: name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [...parents, 'appDataFolder']
    }
    let uri = `https://www.googleapis.com/drive/v3/files`;
    return new Promise<FileResource>((resolve) => {
      this.http.post<FileResource>(uri, schema, {params: query}).subscribe((newFolder) => {
        resolve(newFolder);
      });
    });
  }

  public findFile(name: string): Promise<FileResource | undefined> {
    return new Promise<FileResource | undefined>((resolver) => {
      let query: HttpParams = new HttpParams();
      let search = "mimeType='application/json'"
      search = search + " and "
      search = search + `name='${name}'`
      query = query.append('q', search)
      query = query.append('spaces', 'appDataFolder')
      let uri = `https://www.googleapis.com/drive/v3/files`;
      this.http.get<IFileSearch>(uri,{params: query}).subscribe((res) => {
        if(res && res.files.length > 0){
          resolver(res.files[0]);
        }else resolver(undefined);
      })
    });
  }

  public findFileId(name: string): Observable<string | undefined> {
    return new Observable<string | undefined>((subscriber) => {
      let query: HttpParams = new HttpParams();
      let search = "mimeType='application/json'"
      search = search + " and "
      search = search + `name='${name}'`
      query = query.append('q', search)
      query = query.append('spaces', 'appDataFolder')
      let uri = `https://www.googleapis.com/drive/v3/files`;
      this.http.get<IFileSearch>(uri,{params: query}).subscribe((res) => {
        if(res && res.files.length > 0){
          subscriber.next(res.files[0].id);
        }else subscriber.next(undefined);
      })
    });
  }
}

export class FileCache {
  [key: string]: {time: number, data: any}

  static get cache() {
    let cachedFiles: FileCache = {};
    let initCache = sessionStorage.getItem('cache');
    if(initCache) cachedFiles = JSON.parse(initCache);

    return cachedFiles;
  }

  static getStoredCache(uri: string) {
    let cachedFiles = this.cache;
    if(!cachedFiles[uri]) return undefined;
    return cachedFiles[uri];
  }

  static setStoredCache(uri: string, data: any) {
    let cachedFiles = this.cache;
    cachedFiles[uri] = {time: Date.now(), data: data};
    sessionStorage.setItem('cache', JSON.stringify(cachedFiles));
  }

  static removeStoredCache(uri: string) {
    let cachedFiles = this.cache;
    try {
      delete cachedFiles[uri];
      sessionStorage.setItem('cache', JSON.stringify(cachedFiles));
    }catch{}
  }

  static resetStoredCache() {
    let cachedFiles = this.cache;
    Object.keys(cachedFiles).forEach((v) => {
      delete cachedFiles[v];
    });
    sessionStorage.setItem('cache', JSON.stringify(cachedFiles));
  }

  static isValid(uri: string): boolean {
    let cache = FileCache.getStoredCache(uri);
    if(cache == undefined) return false;

    //if last cache < 10 mins reuse cache
    if (cache.time + 600000 > Date.now()) return true;
    else return false;
  }

  static fullUrl(uri: string, query: HttpParams): string {
    return `${uri}?${query.toString()}`;
  }
}
