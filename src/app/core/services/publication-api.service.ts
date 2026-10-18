import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateListingRequest, Publication } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class PublicationApiService {
  private readonly baseUrl = environment.bffBaseUrl;

  
  constructor(private readonly http: HttpClient) {}

  createListing(body: CreateListingRequest): Observable<Publication> {
    // X-User-Id/X-User-Role los agrega identityHeadersInterceptor con el rol
    // real de los claims de Entra ID (ya configurados los 3 app roles).
    return this.http.post<Publication>(`${this.baseUrl}/listings`, body);
  }

  /** Pide una URL prefirmada, sube el archivo directo a S3 y registra la imagen en la publicación. */
  uploadImage(publicationId: string, file: File, isPrimary: boolean): Observable<Publication> {
    return this.http
      .post<{ uploadUrl: string; fileUrl: string }>(`${this.baseUrl}/listings/${publicationId}/images/presigned-url`, {
        fileName: file.name,
        contentType: file.type,
      })
      .pipe(
        switchMap(({ uploadUrl, fileUrl }) =>
          this.http.put(uploadUrl, file, { headers: { 'Content-Type': file.type } }).pipe(
            switchMap(() =>
              this.http.post<Publication>(`${this.baseUrl}/listings/${publicationId}/images`, {
                imageUrl: fileUrl,
                isPrimary,
              }),
            ),
          ),
        ),
      );
  }
}
