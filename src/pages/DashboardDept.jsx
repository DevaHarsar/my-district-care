import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import {
  Container, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Box, Select, Textarea,
  Button, VStack, HStack, useToast, Alert, AlertIcon, Text, Link
} from '@chakra-ui/react'
import PostCard from '../components/PostCard'
import { getCurrentPosition, distanceKm, googleMapsLink } from '../lib/location'

export default function DashboardDept({ fixedDept }) {
  const params = useParams()
  const routeDept = params.dept
  const { profile } = useAuth()

  // Resolve department: prop > route param > profile
  const dept = fixedDept || routeDept || profile?.department || null

  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)
  const [statusMap, setStatusMap] = useState({})
  const [noteMap, setNoteMap] = useState({})
  const [myLoc, setMyLoc] = useState(null)
  const [locMsg, setLocMsg] = useState('')
  const toast = useToast()

  // Guarded listener – only run when dept is known
  useEffect(() => {
    if (!dept) return
    const q = query(
      collection(db, 'posts'),
      where('departmentTag', '==', dept),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setPosts(list)
      setError(null)
    }, (err) => setError(err.message))
    return () => unsub()
  }, [dept])

  useEffect(() => {
    getCurrentPosition().then((p) => {
      setMyLoc(p)
      setLocMsg('Your location loaded')
    }).catch(() => {
      setLocMsg('Location not available')
    })
  }, [])

  const counts = useMemo(() => {
    const c = { total: posts.length, pending: 0, in_progress: 0, resolved: 0 }
    posts.forEach(p => { if (c[p.status] !== undefined) c[p.status]++ })
    return c
  }, [posts])

  const canEdit = profile?.role === 'admin' || (profile?.role === 'dept' && profile?.department === dept)

  const postsWithDistance = useMemo(() => {
    if (!myLoc) return posts
    return posts.map(p => {
      const d = distanceKm(myLoc, { lat: p.lat, lng: p.lng })
      return { ...p, distanceKm: typeof d === 'number' ? d : undefined }
    })
  }, [posts, myLoc])

  const handleUpdate = async (postId) => {
    const newStatus = statusMap[postId]
    const actionNote = noteMap[postId] || ''
    if (!newStatus) return
    try {
      await updateDoc(doc(db, 'posts', postId), { status: newStatus, actionNote })
      toast({ title: 'Updated', status: 'success', duration: 1500 })
      setStatusMap(prev => ({ ...prev, [postId]: '' }))
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error' })
    }
  }

  return (
    <Container maxW="container.lg" pb={10}>
      {!dept && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          No department resolved from route or profile.
        </Alert>
      )}

      <HStack justify="space-between" mb={4} align="start" wrap="wrap" gap={2}>
        <Heading size="md">{dept || 'Dashboard'}</Heading>
        <HStack>
          <Stat>
            <StatLabel>Total</StatLabel>
            <StatNumber>{counts.total}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Pending</StatLabel>
            <StatNumber>{counts.pending}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>In Progress</StatLabel>
            <StatNumber>{counts.in_progress}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Resolved</StatLabel>
            <StatNumber>{counts.resolved}</StatNumber>
          </Stat>
        </HStack>
      </HStack>

      <HStack mb={4} justify="space-between" wrap="wrap" gap={2}>
        <Text fontSize="sm" color="gray.600">{locMsg}</Text>
        {myLoc && (
          <Text fontSize="sm">
            You: {myLoc.lat.toFixed(4)}, {myLoc.lng.toFixed(4)} ·{' '}
            <Link href={googleMapsLink(myLoc.lat, myLoc.lng)} isExternal color="blue.500">Open in Maps</Link>
          </Text>
        )}
      </HStack>

      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {postsWithDistance.map(p => (
          <Box key={p.id} borderWidth="1px" borderRadius="md" overflow="hidden" bg="white">
            <PostCard post={p} />
            {canEdit && (
              <VStack align="stretch" spacing={3} p={3}>
                <Select placeholder="Change status"
                  value={statusMap[p.id] || ''}
                  onChange={(e) => setStatusMap(prev => ({ ...prev, [p.id]: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </Select>
                <Textarea placeholder="Action note (optional)"
                  value={noteMap[p.id] || ''}
                  onChange={(e) => setNoteMap(prev => ({ ...prev, [p.id]: e.target.value }))} />
                <Button colorScheme="blue" onClick={() => handleUpdate(p.id)}>Save</Button>
              </VStack>
            )}
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  )
}