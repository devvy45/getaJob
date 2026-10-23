import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <main className="notFound">
    <a className="homeLogo" href="/">getajob</a>
    <div>
      <h1>This page has moved on.</h1>
      <p>The role may have closed, or the link is mistyped. Roles on getajob expire quickly so the board stays current.</p>
      <div className="notFoundLinks"><a className="homeHeroCta" href="/jobs">Browse open roles</a><a href="/">Go home</a></div>
    </div>
  </main>;
}
