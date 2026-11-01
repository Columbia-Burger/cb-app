import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { StaffRole, StaffUser, StaffUserRequest } from '../../models/admin.model';

interface RoleOption {
  code: StaffRole;
  icon: string;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss',
})
export class AdminUsuariosComponent implements OnInit {
  private svc = inject(AdminService);

  readonly roles: RoleOption[] = [
    { code: 'ADMIN', icon: '🛡️', label: 'Administrador', hint: 'Acceso total al panel' },
    { code: 'KITCHEN', icon: '👨‍🍳', label: 'Cocina', hint: 'Tablero de cocina' },
    { code: 'DELIVERY', icon: '🛵', label: 'Domicilio', hint: 'App de domiciliarios' },
  ];

  users = signal<StaffUser[]>([]);
  loading = signal(true);
  loadError = signal('');
  currentUsername = this.svc.getCurrentUsername();

  // Formulario (crear o editar)
  formOpen = signal(false);
  editing = signal<StaffUser | null>(null);
  username = '';
  displayName = '';
  role: StaffRole = 'KITCHEN';
  password = '';
  showPassword = false;
  saving = signal(false);
  formError = signal('');
  togglingId = signal<number | null>(null);
  notice = signal('');

  activeCount = computed(() => this.users().filter(u => u.active).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getUsers().subscribe({
      next: users => { this.users.set(users); this.loading.set(false); },
      error: err => {
        this.loadError.set(err?.error?.message ?? 'No se pudieron cargar los usuarios');
        this.loading.set(false);
      },
    });
  }

  roleOf(code: StaffRole): RoleOption {
    return this.roles.find(r => r.code === code)!;
  }

  isSelf(u: StaffUser): boolean {
    return u.username === this.currentUsername;
  }

  openCreate(): void {
    this.editing.set(null);
    this.username = '';
    this.displayName = '';
    this.role = 'KITCHEN';
    this.password = '';
    this.showPassword = false;
    this.formError.set('');
    this.formOpen.set(true);
  }

  openEdit(u: StaffUser): void {
    this.editing.set(u);
    this.username = u.username;
    this.displayName = u.displayName;
    this.role = u.role;
    this.password = '';
    this.showPassword = false;
    this.formError.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  /** Sugiere un usuario a partir del nombre ("Juan Pérez" → "juan.perez"). */
  suggestUsername(): void {
    if (this.editing() || this.username.trim()) return;
    this.username = this.displayName
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 30);
  }

  normalizeUsername(): void {
    this.username = this.username.toLowerCase().replace(/\s+/g, '');
  }

  save(): void {
    const editing = this.editing();
    if (!this.displayName.trim()) { this.formError.set('Escribe el nombre'); return; }
    if (!editing && !this.username.trim()) { this.formError.set('Escribe el usuario'); return; }
    if (!editing && this.password.length < 6) { this.formError.set('La contraseña debe tener al menos 6 caracteres'); return; }
    if (editing && this.password && this.password.length < 6) { this.formError.set('La nueva contraseña debe tener al menos 6 caracteres'); return; }

    const body: StaffUserRequest = editing
      ? {
          displayName: this.displayName.trim(),
          role: this.role,
          ...(this.password ? { password: this.password } : {}),
        }
      : {
          username: this.username.trim(),
          displayName: this.displayName.trim(),
          role: this.role,
          password: this.password,
        };

    this.saving.set(true);
    this.formError.set('');
    const req = editing ? this.svc.updateUser(editing.id, body) : this.svc.createUser(body);
    req.subscribe({
      next: saved => {
        this.upsert(saved);
        this.saving.set(false);
        this.formOpen.set(false);
        this.flash(editing
          ? `Usuario ${saved.username} actualizado${this.password ? ' (con nueva contraseña)' : ''}`
          : `Usuario ${saved.username} creado`);
      },
      error: err => {
        this.formError.set(err?.error?.message ?? 'No se pudo guardar el usuario');
        this.saving.set(false);
      },
    });
  }

  toggleActive(u: StaffUser): void {
    const action = u.active ? 'desactivar' : 'activar';
    if (u.active && !confirm(`¿Desactivar a ${u.displayName} (${u.username})? No podrá iniciar sesión y su sesión actual se cerrará.`)) {
      return;
    }
    this.togglingId.set(u.id);
    this.svc.updateUser(u.id, { active: !u.active }).subscribe({
      next: saved => {
        this.upsert(saved);
        this.togglingId.set(null);
        this.flash(`Usuario ${saved.username} ${saved.active ? 'activado' : 'desactivado'}`);
      },
      error: err => {
        this.togglingId.set(null);
        alert(err?.error?.message ?? `No se pudo ${action} el usuario`);
      },
    });
  }

  private upsert(saved: StaffUser): void {
    this.users.update(list => {
      const exists = list.some(u => u.id === saved.id);
      return exists ? list.map(u => (u.id === saved.id ? saved : u)) : [...list, saved];
    });
  }

  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 3500);
  }
}
