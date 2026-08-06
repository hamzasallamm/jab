import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { CreatePost } from '../components/CreatePost'
import { PostCard } from '../components/PostCard'
import type { PostItem } from '../types'

export function Home() {
  const { me } = useAuth()
  return me ? <Feed /> : <Marketing />
}

function Marketing() {
  return (
    <div className="mx-auto mt-24 max-w-2xl px-4 text-center">
      <h1 className="font-display text-6xl">
        Train. Connect. <span className="text-jab">Compete.</span>
      </h1>
      <p className="mt-4 text-steel-light">The network for combat sports athletes and gyms.</p>
      <Link
        to="/signup"
        className="mt-8 inline-block font-display text-lg rounded bg-jab px-8 py-3 tracking-wide hover:bg-jab-dark"
      >
        Get Started
      </Link>
    </div>
  )
}

function Feed() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get<PostItem[]>('/posts/feed')
      setPosts(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="mx-auto mt-8 max-w-xl px-4 pb-16">
      <CreatePost onCreated={(post) => setPosts((prev) => [post, ...prev])} />
      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-steel-light">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-steel-light">
            No posts yet. Connect with fighters or follow gyms to see their posts here.
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  )
}
