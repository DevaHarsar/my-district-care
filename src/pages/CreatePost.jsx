import { useEffect, useState } from 'react'
import {
  Box, Button, Container, FormControl, FormLabel, Input, Select, Textarea,
  VStack, Progress, Alert, AlertIcon, HStack, Text, Link
} from '@chakra-ui/react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getCurrentPosition, googleMapsLink } from '../lib/location'

const DEPARTMENTS = ['Electricity', 'Water', 'Sewage', 'Road']

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'district-care/images'

export default function CreatePost() {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [departmentTag, setDepartmentTag] = useState(DEPARTMENTS[0])
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [locStatus, setLocStatus] = useState('')

  useEffect(() => {
    getCurrentPosition().then(({ lat, lng }) => {
      setLat(lat)
      setLng(lng)
      setLocStatus('Location detected from browser')
    }).catch(() => {
      setLocStatus('Could not auto-detect location. Enter manually or use the button below.')
    })
  }, [])

  const mapsUrl = googleMapsLink(lat, lng)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUseMyLocation = async () => {
    try {
      const pos = await getCurrentPosition()
      setLat(pos.lat)
      setLng(pos.lng)
      setLocStatus('Location refreshed from browser')
    } catch {
      setLocStatus('Unable to fetch location. Check permissions/GPS.')
    }
  }

  // Upload to Cloudinary using XHR to track progress
  const uploadImage = () => {
    if (!file) return Promise.resolve({ imageURL: '', imageStoragePath: '' })
    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', `${CLOUDINARY_FOLDER}/${user.uid}`)
      formData.append('context', `uid=${user.uid}|email=${user.email}`)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100)
          setProgress(pct)
        }
      })
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText)
              resolve({ imageURL: res.secure_url, imageStoragePath: res.public_id })
            } catch (e) {
              reject(e)
            }
          } else {
            try {
              const res = JSON.parse(xhr.responseText)
              reject(new Error(res.error?.message || 'Cloudinary upload failed'))
            } catch {
              reject(new Error('Cloudinary upload failed'))
            }
          }
        }
      }
      xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'))
      xhr.send(formData)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { imageURL, imageStoragePath } = await uploadImage()
      const payload = {
        title,
        description,
        departmentTag,
        lat: Number(lat),
        lng: Number(lng),
        imageURL,                // Cloudinary secure URL
        imageStoragePath,        // Cloudinary public_id (for future delete/transform)
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: {
          uid: user.uid,
          name: profile?.name || '',
          email: profile?.email || user.email
        },
        actionNote: ''
      }
      await addDoc(collection(db, 'posts'), payload)
      setTitle('')
      setDescription('')
      setFile(null)
      setProgress(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxW="container.sm" pb={12}>
      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Department</FormLabel>
            <Select value={departmentTag} onChange={(e) => setDepartmentTag(e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Image (camera or file)</FormLabel>
            <Input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
            {progress > 0 && <Progress value={progress} mt={2} />}
          </FormControl>
          <HStack align="start">
            <FormControl isRequired>
              <FormLabel>Latitude</FormLabel>
              <Input type="number" step="0.000001" value={lat} onChange={(e) => setLat(e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Longitude</FormLabel>
              <Input type="number" step="0.000001" value={lng} onChange={(e) => setLng(e.target.value)} />
            </FormControl>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">{locStatus}</Text>
            <Button size="sm" onClick={handleUseMyLocation} variant="outline">Use my location</Button>
          </HStack>
          {lat && lng && (
            <Text fontSize="sm">
              Location preview: <Link href={mapsUrl} isExternal color="blue.500">Open in Maps</Link>
            </Text>
          )}
          <Button type="submit" colorScheme="blue" isLoading={submitting}>Submit</Button>
        </VStack>
      </Box>
    </Container>
  )
}