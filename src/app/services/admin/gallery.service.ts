import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from './config';

export interface GalleryImage {
  id: number;
  title?: string;
  description?: string;
  image_path: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  constructor(private http: HttpClient) {}

  getImages(): Observable<GalleryImage[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${API_URL}/api/admin/gallery`).pipe(
      map(res => (res.data || []).map(img => ({
        id: img.id,
        title: img.title,
        description: img.description,
        image_path: img.url,
        is_active: !!img.is_active,
        sort_order: img.sort_order,
        created_at: img.created_at
      })))
    );
  }

  uploadImage(file: File, title?: string, description?: string): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    return this.http.post<{ success: boolean; data: any }>(`${API_URL}/api/admin/gallery`, formData).pipe(
      map(res => {
        const img = res.data;
        return {
          id: img.id,
          title: img.title,
          description: img.description,
          image_path: img.url,
          is_active: !!img.is_active,
          sort_order: img.sort_order,
          created_at: img.created_at
        };
      })
    );
  }

  updateImage(id: number, payload: Partial<GalleryImage>): Observable<GalleryImage> {
    return this.http.patch<{ success: boolean; data: any }>(`${API_URL}/api/admin/gallery/${id}`, payload).pipe(
      map(res => {
        const img = res.data;
        return {
          id: img.id,
          title: img.title,
          description: img.description,
          image_path: img.url,
          is_active: !!img.is_active,
          sort_order: img.sort_order,
          created_at: img.created_at
        };
      })
    );
  }

  deleteImage(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${API_URL}/api/admin/gallery/${id}`);
  }
}
