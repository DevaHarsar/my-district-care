import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Flex, Heading, Spacer, Button, Link, HStack, Badge } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function Header() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin'
  const isDept = profile?.role === 'dept'
  const dept = profile?.department

  return (
    <Box borderBottom="1px solid" borderColor="gray.200" mb={4}>
      <Flex p={3} align="center" wrap="wrap" gap={2}>
        <Heading size="md">
          <Link as={RouterLink} to="/">District Care</Link>
        </Heading>

        <HStack spacing={4} ml={{ base: 0, md: 6 }}>
          <Link as={RouterLink} to="/feed">Feed</Link>
          {user && <Link as={RouterLink} to="/create">Create</Link>}

          {isAdmin && (
            <>
              <Link as={RouterLink} to="/dashboard/Electricity">Electricity</Link>
              <Link as={RouterLink} to="/dashboard/Water">Water</Link>
              <Link as={RouterLink} to="/dashboard/Sewage">Sewage</Link>
              <Link as={RouterLink} to="/dashboard/Road">Road</Link>
              <Link as={RouterLink} to="/admin">Admin</Link>
            </>
          )}

          {isDept && dept && (
            <Link as={RouterLink} to={`/dashboard/${dept}`}>{dept}</Link>
          )}
        </HStack>

        <Spacer />

        {user ? (
          <HStack>
            {profile?.role && (
              <Badge colorScheme={profile.role === 'admin' ? 'purple' : profile.role === 'dept' ? 'orange' : 'gray'}>
                {profile.role}{profile?.department ? ` • ${profile.department}` : ''}
              </Badge>
            )}
            <Button size="sm" onClick={handleLogout}>Logout</Button>
          </HStack>
        ) : (
          <HStack>
            <Button size="sm" as={RouterLink} to="/login" variant="ghost">Login</Button>
            <Button size="sm" as={RouterLink} to="/signup" colorScheme="blue">Sign Up</Button>
          </HStack>
        )}
      </Flex>
    </Box>
  )
}