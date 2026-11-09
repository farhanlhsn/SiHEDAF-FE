export const SESSION_EXPIRED_PATH = "/login?sesi=berakhir";

type PageShowListener = (event: { persisted: boolean }) => void;

type SessionExpiredRedirectDeps = {
  /** Goes to a URL (a full page navigation in the app). */
  navigate: (url: string) => void;
  /** The current pathname. */
  currentPath: () => string;
  /** Subscribes to the window's pageshow event. */
  onPageShow: (listener: PageShowListener) => void;
};

function isLoginPath(pathname: string) {
  return pathname.replace(/\/+$/, "") === "/login";
}

/**
 * The one way a dashboard page goes to the expired-session login. It
 * navigates at most once per page life, however many requests answer 401,
 * and does nothing on /login itself. A page restored from the back-forward
 * cache (pageshow with persisted) is a new visit, so the guard resets there.
 */
export function createSessionExpiredRedirect({
  navigate,
  currentPath,
  onPageShow,
}: SessionExpiredRedirectDeps) {
  let hasNavigated = false;
  let isListening = false;

  return function redirect() {
    if (hasNavigated || isLoginPath(currentPath())) return;

    hasNavigated = true;
    if (!isListening) {
      isListening = true;
      onPageShow((event) => {
        if (event.persisted) hasNavigated = false;
      });
    }
    navigate(SESSION_EXPIRED_PATH);
  };
}

/** The app's shared redirect; apiFetch calls it on every 401. */
export const redirectToSessionExpired = createSessionExpiredRedirect({
  navigate: (url) => window.location.assign(url),
  currentPath: () => window.location.pathname,
  onPageShow: (listener) => window.addEventListener("pageshow", listener),
});
