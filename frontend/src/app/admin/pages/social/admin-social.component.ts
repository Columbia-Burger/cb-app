import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { SocialPost, PostStatus, CatalogProduct } from '../../models/admin.model';

type ActiveTab = 'generator' | 'posts';
type PostMode = 'phrase' | 'product';

@Component({
    selector: 'app-admin-social',
    imports: [FormsModule, DatePipe],
    templateUrl: './admin-social.component.html',
    styleUrl: './admin-social.component.scss'
})
export class AdminSocialComponent implements OnInit {
  private svc = inject(AdminService);

  activeTab = signal<ActiveTab>('generator');
  postMode = signal<PostMode>('phrase');

  // Generator
  topic = signal('');
  imageUrl = signal('');
  tone = signal('casual y apetitoso');
  generating = signal(false);
  generatedPost = signal<SocialPost | null>(null);
  generateError = signal('');

  // Post editor (after generation)
  editCaption = signal('');
  editHashtags = signal('');
  editImageUrl = signal('');
  editScheduledAt = signal('');
  saving = signal(false);

  // Posts list
  posts = signal<SocialPost[]>([]);
  loadingPosts = signal(false);
  filterStatus = signal<PostStatus | 'ALL'>('ALL');
  publishingId = signal<number | null>(null);
  deletingId = signal<number | null>(null);
  listError = signal('');

  filteredPosts = computed(() => {
    const f = this.filterStatus();
    return f === 'ALL' ? this.posts() : this.posts().filter(p => p.status === f);
  });

  // Product picker
  menuProducts = signal<CatalogProduct[]>([]);

  toneOptions = ['casual y apetitoso', 'divertido y juvenil', 'profesional', 'promocional'];

  ngOnInit(): void {
    this.loadPosts();
    this.svc.getAdminProducts().subscribe({
      next: products => this.menuProducts.set(products),
      error: () => {},   // non-critical, don't propagate to auth interceptor
    });
  }

  switchMode(mode: PostMode): void {
    this.postMode.set(mode);
    this.topic.set('');
    this.imageUrl.set('');
    this.generateError.set('');
    this.generatedPost.set(null);
  }

  selectProduct(product: CatalogProduct): void {
    this.topic.set(product.name);
    this.imageUrl.set(product.imageUrl ?? '');
  }

  loadPosts(): void {
    this.loadingPosts.set(true);
    this.svc.getSocialPosts().subscribe({
      next: data => { this.posts.set(data); this.loadingPosts.set(false); },
      error: () => this.loadingPosts.set(false),
    });
  }

  generate(): void {
    if (!this.topic().trim()) return;
    this.generating.set(true);
    this.generateError.set('');
    this.generatedPost.set(null);
    this.svc.generatePost({
      topic: this.topic(),
      imageUrl: this.imageUrl() || undefined,
      tone: this.tone(),
    }).subscribe({
      next: post => {
        this.generatedPost.set(post);
        this.editCaption.set(post.caption);
        this.editHashtags.set(post.hashtags);
        this.editImageUrl.set(post.imageUrl ?? '');
        this.editScheduledAt.set('');
        this.generating.set(false);
      },
      error: (err) => {
        this.generateError.set(err?.error?.message ?? 'Error al generar el contenido');
        this.generating.set(false);
      },
    });
  }

  savePost(status: PostStatus): void {
    const post = this.generatedPost();
    if (!post) return;
    this.saving.set(true);
    this.svc.updateSocialPost(post.id, {
      caption: this.editCaption(),
      hashtags: this.editHashtags(),
      imageUrl: this.editImageUrl() || undefined,
      scheduledAt: this.editScheduledAt() || undefined,
      status,
    }).subscribe({
      next: updated => {
        this.posts.update(list => [updated, ...list.filter(p => p.id !== updated.id)]);
        this.saving.set(false);
        this.generatedPost.set(null);
        this.topic.set('');
        this.imageUrl.set('');
        this.activeTab.set('posts');
      },
      error: () => this.saving.set(false),
    });
  }

  publish(post: SocialPost): void {
    if (!confirm(`¿Publicar "${post.topic}" en Instagram ahora?`)) return;
    this.publishingId.set(post.id);
    this.listError.set('');
    this.svc.publishSocialPost(post.id).subscribe({
      next: updated => {
        this.posts.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.publishingId.set(null);
      },
      error: (err) => {
        this.listError.set(err?.error?.message ?? 'Error al publicar en Instagram');
        this.publishingId.set(null);
      },
    });
  }

  deletePost(post: SocialPost): void {
    if (!confirm('¿Eliminar este post?')) return;
    this.deletingId.set(post.id);
    this.svc.deleteSocialPost(post.id).subscribe({
      next: () => {
        this.posts.update(list => list.filter(p => p.id !== post.id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  approvePost(post: SocialPost): void {
    this.svc.updateSocialPost(post.id, { status: 'APPROVED' }).subscribe({
      next: updated => this.posts.update(list => list.map(p => p.id === updated.id ? updated : p)),
    });
  }

  statusLabel(s: PostStatus): string {
    const map: Record<PostStatus, string> = {
      DRAFT: 'Borrador', APPROVED: 'Aprobado', PUBLISHED: 'Publicado', FAILED: 'Fallido'
    };
    return map[s];
  }

  discardGenerated(): void {
    const post = this.generatedPost();
    if (post) this.svc.deleteSocialPost(post.id).subscribe();
    this.generatedPost.set(null);
    this.topic.set('');
    this.imageUrl.set('');
    this.generateError.set('');
  }
}
