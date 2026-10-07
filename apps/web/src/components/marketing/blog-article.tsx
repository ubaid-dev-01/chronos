import type { BlogSection } from '@/content/blog-posts'

export function BlogArticleBody ({ sections }: { sections: BlogSection[] }) {
  return (
    <div className='prose-chronos'>
      {sections.map((section, i) => {
        switch (section.type) {
          case 'paragraph':
            return (
              <p key={i} className='prose-body mb-6 text-text-secondary'>
                {section.text}
              </p>
            )
          case 'heading':
            return (
              <h2
                key={i}
                id={`section-${i}`}
                className='heading-subsection mb-4 mt-10 scroll-mt-24 text-text-primary first:mt-0'
              >
                {section.text}
              </h2>
            )
          case 'list':
            return (
              <ul key={i} className='mb-6 space-y-2.5'>
                {section.items.map(item => (
                  <li
                    key={item}
                    className='flex items-start gap-3 text-base leading-relaxed text-text-secondary'
                  >
                    <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand' />
                    {item}
                  </li>
                ))}
              </ul>
            )
          case 'quote':
            return (
              <blockquote
                key={i}
                className='my-8 rounded-2xl border-l-4 border-brand bg-brand/5 px-6 py-5'
              >
                <p className='text-lg font-medium leading-relaxed text-text-primary'>
                  &ldquo;{section.text}&rdquo;
                </p>
                {section.attribution && (
                  <cite className='mt-3 block text-sm font-semibold not-italic text-text-secondary'>
                    {section.attribution}
                  </cite>
                )}
              </blockquote>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
