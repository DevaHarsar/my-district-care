import { Box, Image, Text, Badge, HStack, VStack, Stack, Icon, Tag, TagLabel, TagLeftIcon, Link } from '@chakra-ui/react'
import { CheckCircleIcon, TimeIcon, InfoIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { MdElectricalServices } from 'react-icons/md'
import { FaWater, FaRoad } from 'react-icons/fa'
import { GiSewingString } from 'react-icons/gi'
import { googleMapsLink } from '../lib/location'

const statusColor = {
  pending: 'yellow',
  in_progress: 'orange',
  resolved: 'green'
}

const statusIcon = {
  pending: TimeIcon,
  in_progress: InfoIcon,
  resolved: CheckCircleIcon
}

function deptIcon(dept) {
  switch (dept) {
    case 'Electricity': return MdElectricalServices
    case 'Water': return FaWater
    case 'Sewage': return GiSewingString
    case 'Road': return FaRoad
    default: return InfoIcon
  }
}

export default function PostCard({ post }) {
  const IconComp = statusIcon[post.status] || InfoIcon
  const DeptIcon = deptIcon(post.departmentTag)
  const mapsUrl = googleMapsLink(post.lat, post.lng)

  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" bg="white">
      {post.imageURL && (
        <Image src={post.imageURL} alt={post.title} objectFit="cover" w="100%" maxH="280px" />
      )}
      <Stack p={4} spacing={2}>
        <HStack justify="space-between">
          <Text fontWeight="bold">{post.title}</Text>
          <Badge colorScheme={statusColor[post.status] || 'gray'} textTransform="capitalize" display="flex" alignItems="center" gap={1}>
            <Icon as={IconComp} />
            {post.status.replace('_', ' ')}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="gray.700">{post.description}</Text>
        <HStack spacing={3} wrap="wrap">
          <Tag size="sm" colorScheme="blue">
            <TagLeftIcon as={DeptIcon} />
            <TagLabel>{post.departmentTag}</TagLabel>
          </Tag>
          <Badge>
            {post.lat?.toFixed ? post.lat.toFixed(4) : post.lat}, {post.lng?.toFixed ? post.lng.toFixed(4) : post.lng}
          </Badge>
          <Link href={mapsUrl} isExternal fontSize="sm" color="blue.500" display="inline-flex" alignItems="center" gap={1}>
            Open in Maps <ExternalLinkIcon mx="2px" />
          </Link>
          {typeof post.distanceKm === 'number' && (
            <Badge colorScheme="purple">{post.distanceKm.toFixed(2)} km away</Badge>
          )}
        </HStack>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color="gray.500">By: {post?.createdBy?.name || post?.createdBy?.email || 'Unknown'}</Text>
          {post?.actionNote && <Text fontSize="xs" color="gray.600">Note: {post.actionNote}</Text>}
          {post?.createdAt?.toDate && (
            <Text fontSize="xs" color="gray.500">On: {post.createdAt.toDate().toLocaleString()}</Text>
          )}
        </VStack>
      </Stack>
    </Box>
  )
}