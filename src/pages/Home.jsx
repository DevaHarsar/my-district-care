import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import {
  SimpleGrid,
  Container,
  Alert,
  AlertIcon,
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { FaHandsHelping, FaMapMarkerAlt, FaRegLightbulb } from "react-icons/fa";
import PostCard from "../components/PostCard";
import { useNavigate } from "react-router-dom";

export default function Home({ showIntro = true }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(list);
      },
      (err) => setError(err.message)
    );
    return () => unsub();
  }, []);

  return (
    <Container maxW="container.lg" py={10}>
      {showIntro && (
        <>
          <Box
            bgGradient="linear(to-r, blue.500, teal.400)"
            color="white"
            borderRadius="2xl"
            p={{ base: 6, md: 10 }}
            mb={10}
            textAlign="center"
            shadow="lg"
          >
            <Heading size="xl" mb={4}>
              Welcome to District Care
            </Heading>
            <Text fontSize="lg" maxW="700px" mx="auto">
              Empowering citizens and departments to make our districts cleaner,
              safer, and better — together.
            </Text>
            <Button
              mt={6}
              colorScheme="whiteAlpha"
              variant="outline"
              size="lg"
              _hover={{ bg: "white", color: "teal.600" }}
              onClick={() => navigate("/login")}
            >
              Report an Issue
            </Button>
          </Box>

          <Box
            bg="white"
            borderWidth="1px"
            borderRadius="2xl"
            p={6}
            mb={10}
            shadow="md"
          >
            <Heading size="md" mb={3}>
              About District Care
            </Heading>
            <Text color="gray.600">
              District Care is a community-driven platform that bridges the gap
              between citizens and local government departments. Users can report
              local issues like road damage, garbage collection, or water leakage
              with photos, descriptions, and locations. Departments can track,
              respond, and resolve these issues in real time, ensuring transparency
              and accountability.
            </Text>
          </Box>

          <VStack spacing={8} mb={10}>
            <Heading size="md">How It Works</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box
                textAlign="center"
                p={6}
                bg="gray.50"
                borderRadius="xl"
                shadow="sm"
                _hover={{ shadow: "md", transform: "scale(1.03)" }}
                transition="0.3s"
              >
                <Icon as={FaMapMarkerAlt} boxSize={10} color="blue.500" mb={3} />
                <Heading size="sm" mb={2}>
                  1️⃣ Report an Issue
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Upload a photo, add details, and share the exact location of the
                  problem.
                </Text>
              </Box>

              <Box
                textAlign="center"
                p={6}
                bg="gray.50"
                borderRadius="xl"
                shadow="sm"
                _hover={{ shadow: "md", transform: "scale(1.03)" }}
                transition="0.3s"
              >
                <Icon as={FaHandsHelping} boxSize={10} color="teal.500" mb={3} />
                <Heading size="sm" mb={2}>
                  2️⃣ Department Action
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  The issue is assigned to the respective department for review and
                  action.
                </Text>
              </Box>

              <Box
                textAlign="center"
                p={6}
                bg="gray.50"
                borderRadius="xl"
                shadow="sm"
                _hover={{ shadow: "md", transform: "scale(1.03)" }}
                transition="0.3s"
              >
                <Icon as={FaRegLightbulb} boxSize={10} color="orange.400" mb={3} />
                <Heading size="sm" mb={2}>
                  3️⃣ Real-time Updates
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Citizens can track the progress, receive updates, and see when the
                  issue is resolved.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>

          <Divider mb={8} />
        </>
      )}

      <Heading size="md" mb={5}>
        Recent Reports
      </Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Box textAlign="center" py={10} color="gray.500">
          No reports yet. Be the first to make a difference!
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}