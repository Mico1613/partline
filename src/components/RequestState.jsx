export function Loader({ children }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      {children}
    </div>
  );
}
export function ErrorMessage({ message, retry }) {
  return (
    <div className="error" role="alert">
      <span>{message}</span>
      <button onClick={retry}>Повторить</button>
    </div>
  );
}
