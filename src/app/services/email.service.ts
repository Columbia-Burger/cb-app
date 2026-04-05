import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../environments/environment';

export interface ContactFormData {
  from_name: string;
  asunto: string;
  email_id: string;
  phone: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  constructor() {
    emailjs.init(environment.emailjs.publicKey);
  }

  sendEmail(formData: ContactFormData): Promise<void> {
    return emailjs
      .send(
        environment.emailjs.serviceId,
        environment.emailjs.templateId,
        formData as unknown as Record<string, unknown>
      )
      .then(() => undefined);
  }
}
