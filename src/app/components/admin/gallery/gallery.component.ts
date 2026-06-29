import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService, GalleryImage } from '../../../services/admin/gallery.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery.component.html'
})
export class GalleryComponent implements OnInit {
  galleryService = inject(GalleryService);
  toastService = inject(ToastService);

  images = signal<GalleryImage[]>([]);
  isLoading = signal(true);

  // Modals state
  showUploadModal = signal(false);
  showEditModal = signal(false);

  // Upload Form fields
  selectedFiles: File[] = [];
  previewUrls = signal<string[]>([]);
  uploadTitle = signal('');
  uploadDescription = signal('');
  isUploading = signal(false);
  uploadProgressText = signal('');

  // Edit Form fields
  editingImage = signal<GalleryImage | null>(null);
  editTitle = signal('');
  editDescription = signal('');
  isSavingEdit = signal(false);

  ngOnInit() {
    this.fetchImages();
  }

  fetchImages() {
    this.isLoading.set(true);
    this.galleryService.getImages().subscribe({
      next: (data: any) => {
        this.images.set(data.sort((a: any, b: any) => a.sort_order - b.sort_order));
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.images.set([]);
        console.error('Failed to load gallery images', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to load gallery images from database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  onToggleActive(img: GalleryImage) {
    const updatedStatus = !img.is_active;
    this.galleryService.updateImage(img.id, { is_active: updatedStatus }).subscribe({
      next: (res: any) => {
        this.images.update(list => list.map(item => item.id === img.id ? { ...item, is_active: updatedStatus } : item));
        this.toastService.show(`Image "${img.title || 'Untitled'}" is now ${updatedStatus ? 'active' : 'inactive'}`, 'success');
      },
      error: (err: any) => {
        console.error('Failed to toggle active state', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to toggle visibility status in database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  onDelete(img: GalleryImage) {
    const confirmDelete = confirm(`Are you sure you want to delete the image "${img.title || 'Untitled'}"?`);
    if (!confirmDelete) return;

    this.galleryService.deleteImage(img.id).subscribe({
      next: () => {
        this.images.update(list => list.filter(item => item.id !== img.id));
        this.toastService.show('Image deleted successfully', 'success');
      },
      error: (err: any) => {
        console.error('Failed to delete image', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to delete image from database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...files];
      
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrls.update(urls => [...urls, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  openUploadModal() {
    this.selectedFiles = [];
    this.previewUrls.set([]);
    this.uploadTitle.set('');
    this.uploadDescription.set('');
    this.uploadProgressText.set('');
    this.showUploadModal.set(true);
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
  }

  onUploadSubmit() {
    if (this.selectedFiles.length === 0) {
      this.toastService.show('Please select at least one image file first', 'error');
      return;
    }

    // Pre-validate file sizes (max 5MB per file, matching Laravel rules)
    const oversizedFiles = this.selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const names = oversizedFiles.map(f => f.name).join(', ');
      this.toastService.show(`Files exceed 5MB limit: ${names}. Please choose smaller files.`, 'error');
      return;
    }

    this.isUploading.set(true);
    const totalCount = this.selectedFiles.length;
    let succeededCount = 0;
    
    const uploadNext = (index: number) => {
      if (index >= totalCount) {
        this.isUploading.set(false);
        if (succeededCount > 0) {
          this.toastService.show(`Successfully uploaded ${succeededCount} of ${totalCount} image(s)`, 'success');
        } else {
          this.toastService.show('Failed to upload selected image(s)', 'error');
        }
        this.closeUploadModal();
        this.fetchImages();
        return;
      }

      this.uploadProgressText.set(`Uploading image ${index + 1} of ${totalCount}...`);
      const file = this.selectedFiles[index];

      // Use the specified title only if it's a single file upload, or append index/suffix for batch
      const titleStr = this.uploadTitle() 
        ? (totalCount > 1 ? `${this.uploadTitle()} - ${index + 1}` : this.uploadTitle()) 
        : undefined;

      this.galleryService.uploadImage(file, titleStr, this.uploadDescription() || undefined).subscribe({
        next: () => {
          succeededCount++;
          uploadNext(index + 1);
        },
        error: (err: any) => {
          console.error(`Failed to upload ${file.name}`, err);
          let errMsg = `Failed to upload ${file.name}`;
          if (err.error?.errors) {
            const firstKey = Object.keys(err.error.errors)[0];
            if (firstKey && err.error.errors[firstKey][0]) {
              errMsg = `${err.error.errors[firstKey][0]}`;
            }
          } else if (err.error?.message) {
            errMsg = `${err.error.message}`;
          }
          this.toastService.show(errMsg, 'error');
          uploadNext(index + 1);
        }
      });
    };

    uploadNext(0);
  }

  openEditModal(img: GalleryImage) {
    this.editingImage.set(img);
    this.editTitle.set(img.title || '');
    this.editDescription.set(img.description || '');
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onEditSubmit() {
    const img = this.editingImage();
    if (!img) return;

    this.isSavingEdit.set(true);
    const payload = {
      title: this.editTitle(),
      description: this.editDescription()
    };

    this.galleryService.updateImage(img.id, payload).subscribe({
      next: (res: any) => {
        this.isSavingEdit.set(false);
        this.images.update(list => list.map(item => item.id === img.id ? { ...item, ...payload } : item));
        this.toastService.show('Image details updated successfully', 'success');
        this.closeEditModal();
      },
      error: (err: any) => {
        this.isSavingEdit.set(false);
        console.error('Failed to edit image details', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to update image details in database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }
}
