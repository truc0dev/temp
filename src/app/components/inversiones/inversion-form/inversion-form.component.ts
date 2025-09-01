import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InversionesService } from '../../../services/inversiones.service';
import { Inversion } from '../../../models/inversion.model';

@Component({
  selector: 'app-inversion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inversion-form.component.html',
  styleUrls: ['./inversion-form.component.scss']
})
export class InversionFormComponent implements OnInit {
  @Input() inversion: Inversion | null = null;
  @Input() isEditing = false;
  @Output() onSubmit = new EventEmitter<Inversion>();
  @Output() onCancel = new EventEmitter<void>();

  inversionForm: FormGroup;
  tiposInversion = ['ganado', 'pastura', 'infraestructura', 'otro'];

  constructor(
    private fb: FormBuilder,
    private inversionesService: InversionesService
  ) {
    this.inversionForm = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.inversion) {
      this.inversionForm.patchValue(this.inversion);
    }
  }

  submitForm(): void {
    if (this.inversionForm.valid) {
      const formData = {
        ...this.inversionForm.value,
        id: this.inversion?.id
      };
      this.onSubmit.emit(formData);
    }
  }

  cancel(): void {
    this.onCancel.emit();
  }
} 