export function SocialCounts({
  followerCount,
  followingCount,
  connectionCount,
}: {
  followerCount: number
  followingCount: number
  connectionCount?: number
}) {
  return (
    <div className="mt-4 flex gap-5 text-sm">
      <span>
        <span className="font-display text-lg">{followerCount}</span>{' '}
        <span className="text-steel-light">Followers</span>
      </span>
      <span>
        <span className="font-display text-lg">{followingCount}</span>{' '}
        <span className="text-steel-light">Following</span>
      </span>
      {connectionCount !== undefined && (
        <span>
          <span className="font-display text-lg">{connectionCount}</span>{' '}
          <span className="text-steel-light">Connections</span>
        </span>
      )}
    </div>
  )
}
