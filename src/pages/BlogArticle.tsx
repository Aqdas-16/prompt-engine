import { blogs } from "../data/blog";
import ReactMarkdown from "react-markdown";

export default function BlogArticle() {

const slug =
window.location.pathname.split("/").pop();

const article =
blogs.find((b) => b.slug === slug);

if (!article) {
return (
<div className="p-10">
Article Not Found
</div>
);
}

return (
<div className="min-h-screen bg-slate-50">

  <div className="max-w-5xl mx-auto px-6 py-12">
  <div
    className="
    bg-white
    dark:bg-slate-900
    rounded-3xl
    border
    border-slate-200
    dark:border-slate-800
    shadow-sm
    p-8
    md:p-14
    "
  >

    <button
      onClick={() => {
        window.location.href = "/blog";
      }}
      className="
        inline-flex
        items-center
        gap-2
        text-blue-600
        hover:text-blue-700
        font-medium
        mb-8
      "
    >
      ← Back to Blog
    </button>

    <div className="
      bg-white
      rounded-3xl
      shadow-lg
      p-10
      md:p-14
    ">

      <div className="flex items-center gap-3 mb-6">

        <span className="
        px-3
        py-1
        rounded-full
        bg-blue-100
        text-blue-700
        text-xs
        font-semibold
        ">
          {article.category}
        </span>

        <span className="text-sm text-slate-500">
          {article.readTime}
        </span>

      </div>

      <h1 className="
      text-3xl
      md:text-5xl
      font-extrabold
      tracking-tight
      text-slate-900
      dark:text-white
      mb-5
      ">
        {article.title}
      </h1>

      <p className="
      text-xl
      text-slate-500
      mb-12
      ">
        {article.description}
      </p>

      <article
        className="
        prose
        prose-slate
        prose-lg
        max-w-none

        prose-headings:font-bold
        prose-headings:text-slate-900

        prose-h2:text-3xl
        prose-h2:mt-12
        prose-h2:mb-5

        prose-h3:text-xl

        prose-p:text-slate-700
        prose-p:leading-8

        prose-li:text-slate-700

        dark:prose-invert
      "
      >
        <ReactMarkdown>
          {article.content}
        </ReactMarkdown>
      </article>

    </div>

  </div>
  </div>
</div>
);
}