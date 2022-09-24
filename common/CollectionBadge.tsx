import type { Badge } from 'config/config'

export const CollectionBadge = ({ badge }: { badge: Badge }) => {
  const content = badge.content
  return {
    recent: <span className="text-primary">👋 Recently listed</span>,
    trending: <span className="text-primary">🔥 Trending</span>,
    expiration: <span className="text-light-0">⏰ {content}</span>,
    content: { content },
  }[badge.badgeType]
}
