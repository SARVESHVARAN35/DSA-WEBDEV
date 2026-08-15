import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm font-semibold text-cobalt">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-slateink">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
