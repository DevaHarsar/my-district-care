import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  SimpleGrid,
  Container,
  Alert,
  AlertIcon,
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
  Icon,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaHandsHelping, FaMapMarkerAlt, FaRegLightbulb } from "react-icons/fa";
import PostCard from "../components/PostCard";
import { useNavigate } from "react-router-dom";

export default function Home({ showIntro = true }) {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  });
  const [lastVisible, setLastVisible] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const PAGE_SIZE = 6; // show 6 items per page by default

  // Get total count of documents
  useEffect(() => {
    const q = query(collection(db, "posts"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTotalDocs(snap.size);
        // compute status counts across all posts for the feed
        const c = { total: snap.size, pending: 0, in_progress: 0, resolved: 0 };
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data?.status && c[data.status] !== undefined) c[data.status]++;
        });
        setCounts(c);
        setError(null);
      },
      (err) => setError(err.message)
    );
    return () => unsub();
  }, []);

  // Fetch paginated data
  const fetchPage = async (pageNum, cursor = null) => {
    setIsLoading(true);
    try {
      let q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (cursor) {
        q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(cursor),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(list);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial page
  useEffect(() => {
    fetchPage(1);
  }, []);

  // reset page when total docs change or clamp page to available pages
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
    if (totalDocs > 0 && page === 0) setPage(1);
  }, [totalDocs, PAGE_SIZE]);

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
            boxShadow="none"
            mx="auto"
            maxW={{ base: "100%", md: "container.md" }}
          >
            <Heading size="xl" mb={4}>
              Welcome to District Care
            </Heading>
            <Text fontSize="lg" maxW="700px" mx="auto">
              Empowering citizens and departments to make our districts cleaner,
              safer, and better — together.
            </Text>
            {/* darker, attention-grabbing blinking button */}
            <Button
              mt={6}
              size="lg"
              bgGradient="linear(to-r, blue.600, teal.500)"
              color="white"
              boxShadow="md"
              _hover={{
                bgGradient: "linear(to-r, blue.700, teal.600)",
                transform: "translateY(-1px)",
                animationPlayState: "paused",
                opacity: 1,
              }}
              _active={{
                bgGradient: "linear(to-r, blue.800, teal.700)",
                transform: "translateY(0)",
                animationPlayState: "paused",
                opacity: 1,
              }}
              _focus={{
                boxShadow: "outline",
                animationPlayState: "paused",
                opacity: 1,
              }}
              onClick={() => navigate("/login")}
              animation={`${keyframes`
                0%, 100% { opacity: 1; transform: translateY(0); }
                50% { opacity: 0.5; transform: translateY(-2px); }
              `} 1.2s ease-in-out infinite`}
            >
              Report an Issue
            </Button>
          </Box>

          <Box
            bg="white"
            // borderWidth="1px"
            // borderRadius="2xl"
            p={6}
            mb={10}
            boxShadow="none"
            mx="auto"
            maxW={{ base: "100%", md: "container.md" }}
          >
            <Heading size="md" mb={3} textAlign="center">
              About District Care
            </Heading>
            <Text
              color="gray.600"
              textAlign={{ base: "justify", md: "center" }}
              fontStyle="italic"
            >
              District Care is a community-driven platform that bridges the gap
              between citizens and local government departments. Users can
              report local issues like road damage, garbage collection, or water
              leakage with photos, descriptions, and locations. Departments can
              track, respond, and resolve these issues in real time, ensuring
              transparency and accountability.
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
                boxShadow="none"
                transition="0.3s"
                mx="auto"
              >
                <Icon
                  as={FaMapMarkerAlt}
                  boxSize={10}
                  color="blue.500"
                  mb={3}
                />
                <Heading size="sm" mb={2}>
                  1️⃣ Report an Issue
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Upload a photo, add details, and share the exact location of
                  the problem.
                </Text>
              </Box>

              <Box
                textAlign="center"
                p={6}
                bg="gray.50"
                borderRadius="xl"
                boxShadow="none"
                transition="0.3s"
                mx="auto"
              >
                <Icon
                  as={FaHandsHelping}
                  boxSize={10}
                  color="teal.500"
                  mb={3}
                />
                <Heading size="sm" mb={2}>
                  2️⃣ Department Action
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  The issue is assigned to the respective department for review
                  and action.
                </Text>
              </Box>

              <Box
                textAlign="center"
                p={6}
                bg="gray.50"
                borderRadius="xl"
                boxShadow="none"
                transition="0.3s"
                mx="auto"
              >
                <Icon
                  as={FaRegLightbulb}
                  boxSize={10}
                  color="orange.400"
                  mb={3}
                />
                <Heading size="sm" mb={2}>
                  3️⃣ Real-time Updates
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Citizens can track the progress, receive updates, and see when
                  the issue is resolved.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>

          <Divider mb={8} />
        </>
      )}

      <HStack justify="space-between" mb={5} align="center" wrap="wrap" gap={2}>
        <Heading size="md">Recent Reports</Heading>

        <HStack spacing={{ base: 3, md: 6 }} align="center">
          <Stat textAlign="center">
            <StatLabel
              bgGradient="linear(to-r, purple.500, purple.700)"
              bgClip="text"
              fontWeight="bold"
            >
              Total
            </StatLabel>
            <StatNumber color="black" fontWeight="semibold">
              {counts.total}
            </StatNumber>
          </Stat>

          <Stat textAlign="center">
            <StatLabel
              bgGradient="linear(to-r, purple.500, purple.700)"
              bgClip="text"
              fontWeight="bold"
            >
              Pending
            </StatLabel>
            <StatNumber color="black" fontWeight="semibold">
              {counts.pending}
            </StatNumber>
          </Stat>

          <Stat textAlign="center">
            <StatLabel
              bgGradient="linear(to-r, purple.500, purple.700)"
              bgClip="text"
              fontWeight="bold"
              whiteSpace="nowrap"
              title="In Progress"
            >
              In Progress
            </StatLabel>
            <StatNumber color="black" fontWeight="semibold">
              {counts.in_progress}
            </StatNumber>
          </Stat>

          <Stat textAlign="center">
            <StatLabel
              bgGradient="linear(to-r, purple.500, purple.700)"
              bgClip="text"
              fontWeight="bold"
            >
              Resolved
            </StatLabel>
            <StatNumber color="black" fontWeight="semibold">
              {counts.resolved}
            </StatNumber>
          </Stat>
        </HStack>
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Box
              key={`skeleton-${i}`}
              borderWidth="1px"
              borderRadius="md"
              overflow="hidden"
              bg="white"
              p={4}
            >
              <Skeleton height="180px" mb={3} borderRadius="md" />
              <SkeletonText mt="4" noOfLines={3} spacing="4" />
            </Box>
          ))}
        </SimpleGrid>
      ) : posts.length === 0 ? (
        <Box textAlign="center" py={10} color="gray.500">
          No reports yet. Be the first to make a difference!
        </Box>
      ) : (
        <>
          {/* Paginated grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </SimpleGrid>

          {/* Truncated Pagination controls */}
          {totalDocs > PAGE_SIZE && (
            <HStack spacing={2} justifyContent="center" mt={6}>
              <Button
                size="sm"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  fetchPage(page - 1);
                }}
                isDisabled={page === 1 || isLoading}
              >
                Prev
              </Button>

              {(() => {
                const totalPages = Math.ceil(totalDocs / PAGE_SIZE);
                const pageNumbers = [];

                // Always show first page
                if (page > 3) pageNumbers.push(1);
                if (page > 4) pageNumbers.push("...");

                // Show pages around current page
                for (
                  let i = Math.max(1, page - 2);
                  i <= Math.min(totalPages, page + 2);
                  i++
                ) {
                  pageNumbers.push(i);
                }

                // Always show last page
                if (page < totalPages - 3) pageNumbers.push("...");
                if (page < totalPages - 2) pageNumbers.push(totalPages);

                return pageNumbers.map((pageNum, index) => {
                  if (pageNum === "...") {
                    return (
                      <Text key={`ellipsis-${index}`} color="gray.500">
                        ...
                      </Text>
                    );
                  }
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={pageNum === page ? "solid" : "outline"}
                      colorScheme={pageNum === page ? "blue" : "gray"}
                      onClick={() => {
                        setPage(pageNum);
                        fetchPage(pageNum);
                      }}
                      isDisabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                });
              })()}

              <Button
                size="sm"
                onClick={() => {
                  setPage((p) => p + 1);
                  fetchPage(page + 1, lastVisible);
                }}
                isDisabled={
                  page === Math.ceil(totalDocs / PAGE_SIZE) || isLoading
                }
              >
                Next
              </Button>
            </HStack>
          )}
        </>
      )}
    </Container>
  );
}
