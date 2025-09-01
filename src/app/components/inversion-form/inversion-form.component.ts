import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InversionesService } from '../../services/inversiones.service';
import { Inversion } from '../../models/inversion.model';

@Component({
  selector: 'app-inversion-form',
  templateUrl: './inversion-form.component.html',
  styleUrls: ['./inversion-form.component.scss']
})
export class InversionFormComponent implements OnInit {
  inversionForm: FormGroup;
  formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private inversionesService: InversionesService,
    private snackBar: MatSnackBar
  ) {
    this.inversionForm = this.fb.group({
      nombre: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(0)]],
      fecha: ['', Validators.required],
      tipo: ['', Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.inversionForm.valid) {
      const nuevaInversion: Inversion = this.inversionForm.value;
      this.inversionesService.addInversion(nuevaInversion).subscribe({
        next: (response: Inversion) => {
          this.inversionForm.reset();
          this.formSubmitted = false;
          this.snackBar.open('Inversión agregada exitosamente', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error: any) => {
          console.error('Error al agregar inversión:', error);
          this.snackBar.open('Error al agregar la inversión', 'Cerrar', {
            duration: 3000
          });
        }
      });
    } else {
      this.formSubmitted = true;
    }
  }
} 