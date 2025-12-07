import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-photo-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Photos (optionnel)
          <span class="text-gray-500 font-normal ml-1">- Ajoutez des photos pour documenter l'état</span>
        </label>
        
        <!-- Upload Button -->
        <button 
          type="button"
          (click)="triggerFileInput()"
          [disabled]="disabled()"
          class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-gray-600 font-medium">Ajouter des photos</span>
        </button>
      </div>

      <!-- Preview Grid -->
      @if (photos().length > 0) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          @for (photo of photos(); track $index) {
            <div class="relative group">
              <img 
                [src]="photo" 
                alt="Photo {{$index + 1}}"
                class="w-full h-32 object-cover rounded-lg border border-gray-200" />
              
              <!-- Remove Button -->
              <button 
                type="button"
                (click)="removePhoto($index)"
                class="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <!-- Counter -->
              <div class="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                {{ $index + 1 }}
              </div>
            </div>
          }
        </div>
        
        <p class="text-sm text-gray-500">
          {{ photos().length }} photo(s) ajoutée(s)
        </p>
      }

      <!-- Hidden File Input -->
      <input 
        #fileInput
        type="file" 
        accept="image/*" 
        multiple 
        (change)="onFilesSelected($event)"
        class="hidden" />
    </div>
  `
})
export class InventoryPhotoUploaderComponent {
  disabled = input(false);
  photos = input.required<string[]>();
  photosChange = output<string[]>();

  fileInput?: HTMLInputElement;

  triggerFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e: any) => {
      this.onFilesSelected(e);
    };
    
    input.click();
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target?.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    let processed = 0;
    const newPhotos: string[] = [];

    fileArray.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        newPhotos.push(e.target.result);
        processed++;
        
        if (processed === fileArray.length) {
          const updatedPhotos = [...this.photos(), ...newPhotos];
          this.photosChange.emit(updatedPhotos);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }

  removePhoto(index: number) {
    const updatedPhotos = [...this.photos()];
    updatedPhotos.splice(index, 1);
    this.photosChange.emit(updatedPhotos);
  }
}
