import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',              // Landing page
    renderMode: RenderMode.Prerender
  },
  {
    path: 'room/:id',      // Dynamic room route
    renderMode: RenderMode.Server   // 👈 disable prerender here
  },
  {
    path: '**',            // Fallback
    renderMode: RenderMode.Server   // 👈 also server-render only
  },

];