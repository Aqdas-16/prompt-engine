import { blogs } from "../data/blog";

export default function Blog() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      <div className="max-w-6xl mx-auto px-6 py-20">

        <div className="text-center mb-16">

          <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            PromptEngine Knowledge Hub
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
            PromptEngine Blog
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Learn prompt engineering, discover AI tools, and access production-ready prompts.
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {blogs.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="
              group
              flex
              flex-col
              justify-between
              h-full
              p-8
              rounded-3xl
              bg-white
              dark:bg-slate-900
              border
              border-slate-200
              dark:border-slate-800
              hover:border-blue-400
              hover:shadow-2xl
              transition-all
              duration-300
              hover:-translate-y-2
              "
            >
              <div className="flex items-center gap-3 mb-4">

                  <span
                    className="
                    px-3
                    py-1
                    rounded-full
                    bg-blue-100
                    text-blue-700
                    text-xs
                    font-semibold
                    "
                  >
                    {article.category}
                  </span>

                  <span className="text-sm text-slate-500">
                    {article.readTime}
                  </span>

                </div>
              <h2 className="
                text-2xl
                font-bold
                text-slate-900
                dark:text-white
                group-hover:text-blue-600
                mb-3
              ">
                {article.title}
              </h2>

              <p className="
                text-slate-600
                dark:text-slate-400
                leading-relaxed
              ">
                {article.description}
              </p>

              <div className="mt-6 text-blue-600 font-semibold">
                Read Article →
              </div>
            </a>
          ))}

        </div>

      </div>
    </div>
  );
}