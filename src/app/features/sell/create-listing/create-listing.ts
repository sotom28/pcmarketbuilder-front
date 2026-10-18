import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { PublicationApiService } from '../../../core/services/publication-api.service';
import { Category, CreateListingRequest, Grade, Product } from '../../../core/models/catalog.models';
import { gradeLabel } from '../../../core/utils/labels';

@Component({
  selector: 'app-create-listing',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './create-listing.html',
  styleUrl: './create-listing.css',
})

export class CreateListing implements OnInit {
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly searching = signal(false);
  readonly selectedProduct = signal<Product | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly photos = signal<File[]>([]);
  readonly previews = signal<string[]>([]);
  readonly createdId = signal<string | null>(null);

  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxPhotoBytes = 5 * 1024 * 1024;
  private readonly maxPhotos = 6;

  readonly grades: Grade[] = ['GRADE_A', 'GRADE_B', 'GRADE_C'];
  readonly gradeLabel = gradeLabel;

  subcategoryId?: string;
  productQuery = '';

  form: Omit<CreateListingRequest, 'productId'> = {
    title: '',
    description: '',
    price: 0,
    grade: 'GRADE_A',
    usageTimeMonths: undefined,
  };

  constructor(
    private readonly catalogApi: CatalogApiService,
    private readonly productApi: ProductApiService,
    private readonly publicationApi: PublicationApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.catalogApi.getCategories().subscribe({ next: (categories) => this.categories.set(categories) });
    this.searchProducts();
  }

  searchProducts(): void {
    this.searching.set(true);
    this.productApi
      .searchProducts({ subcategoryId: this.subcategoryId, q: this.productQuery, page: 1, limit: 20 })
      .subscribe({
        next: (page) => {
          this.products.set(page.content);
          this.searching.set(false);
        },
        error: () => {
          this.error.set('No se pudo buscar productos.');
          this.searching.set(false);
        },
      });
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
    if (!this.form.title) {
      this.form.title = `${product.brand} ${product.model}`;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const invalid = files.find((f) => !this.allowedTypes.includes(f.type) || f.size > this.maxPhotoBytes);
    if (invalid) {
      this.error.set(`"${invalid.name}" no es válida: usa JPG, PNG o WebP de hasta 5 MB.`);
      input.value = '';
      return;
    }
    if (files.length > this.maxPhotos) {
      this.error.set(`Puedes subir hasta ${this.maxPhotos} fotos.`);
      input.value = '';
      return;
    }
    this.error.set(null);
    this.photos.set(files);
    this.previews.set(files.map((f) => URL.createObjectURL(f)));
  }

  /** Sube las fotos en orden (la primera queda como principal) y luego abre la publicación. */
  private async uploadPhotos(publicationId: string): Promise<void> {
    try {
      const files = this.photos();
      for (let i = 0; i < files.length; i++) {
        await firstValueFrom(this.publicationApi.uploadImage(publicationId, files[i], i === 0));
      }
      this.router.navigate(['/listings', publicationId]);
    } catch (err) {
      console.error('Error al subir las fotos', err);
      const e = err as HttpErrorResponse;
      const detail = typeof e.error?.message === 'string' ? ` (${e.error.message})` : '';
      this.error.set(`La publicación se creó, pero las fotos no se pudieron subir${detail}.`);
      this.createdId.set(publicationId);
    } finally {
      this.submitting.set(false);
    }
  }

  submit(): void {
    const product = this.selectedProduct();
    if (!product) {
      this.error.set('Elegí un producto del catálogo antes de publicar.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.publicationApi
      .createListing({
        productId: product.productId,
        title: this.form.title,
        description: this.form.description || undefined,
        price: this.form.price,
        grade: this.form.grade,
        usageTimeMonths: this.form.usageTimeMonths || undefined,
      })
      .subscribe({
        next: (publication) => this.uploadPhotos(publication.publicationId),
        error: (err: HttpErrorResponse) => {
          console.error('Error al crear la publicación', err);
          const upstreamMessage = typeof err.error?.message === 'string' ? err.error.message : null;
          this.error.set(upstreamMessage ?? `No se pudo crear la publicación (HTTP ${err.status}).`);
          this.submitting.set(false);
        },
      });
  }
}
