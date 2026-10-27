export function Loader({ children }) {
  return (
    <div className="d-flex align-items-center gap-2 py-3" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      {children}
    </div>
  );
}
export function ErrorMessage({ message, retry }) {
  return (
    <div
      className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 mb-0"
      role="alert"
    >
      <span>{message}</span>
      <button className="btn btn-sm btn-danger" onClick={retry}>
        Повторить
      </button>
    </div>
  );
}
