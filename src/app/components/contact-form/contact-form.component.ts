import { Component, ElementRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { EmailService } from '../../services/email.service';

// Bootstrap está cargado globalmente via angular.json scripts
declare const bootstrap: {
  Modal: new (el: HTMLElement) => { show(): void };
};

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent {
  @ViewChild('emailModal') emailModalRef!: ElementRef<HTMLElement>;

  contactForm: FormGroup;
  isSubmitting = false;
  modalMessage = '';
  modalIsSuccess = false;

  constructor(private fb: FormBuilder, private emailService: EmailService) {
    this.contactForm = this.fb.group({
      from_name: ['', [Validators.required]],
      asunto: ['', [Validators.required]],
      email_id: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
      message: ['', [Validators.required]],
    });
  }

  // Acceso tipado a los controles del formulario
  getControl(name: string): AbstractControl {
    return this.contactForm.get(name)!;
  }

  isInvalid(name: string): boolean {
    const control = this.getControl(name);
    return control.invalid && control.touched;
  }

  onSubmit(): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) return;

    this.isSubmitting = true;

    this.emailService
      .sendEmail(this.contactForm.value)
      .then(() => {
        this.isSubmitting = false;
        this.modalIsSuccess = true;
        this.modalMessage = '¡Correo enviado con éxito!';
        this.contactForm.reset();
        this.openModal();
      })
      .catch((err: unknown) => {
        this.isSubmitting = false;
        this.modalIsSuccess = false;
        this.modalMessage = `Error al enviar el correo: ${JSON.stringify(err)}`;
        this.openModal();
      });
  }

  private openModal(): void {
    const modal = new bootstrap.Modal(this.emailModalRef.nativeElement);
    modal.show();
  }
}
