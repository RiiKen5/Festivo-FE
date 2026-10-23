import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private api: ApiService) {}

  /**
   * Upload an image; resolves to its public URL
   * POST /api/v1/uploads
   */
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload<{ data: { url: string } }>('/uploads', formData).pipe(map(r => r.data.url));
  }
}
