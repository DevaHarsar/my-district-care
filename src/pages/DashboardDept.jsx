import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Box,
  Select,
  Textarea,
  Button,
  VStack,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Link,
} from "@chakra-ui/react";
import PostCard from "../components/PostCard";
import {
  getCurrentPosition,
  distanceKm,
  googleMapsLink,
} from "../lib/location";

export default function DashboardDept({ fixedDept }) {
  const params = useParams();
  const routeDept = params.dept;
  const { profile } = useAuth();

  // Resolve department: prop > route param > profile
  const dept = fixedDept || routeDept || profile?.department || null;

  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [myLoc, setMyLoc] = useState(null);
  const [locMsg, setLocMsg] = useState("");
  const [page, setPage] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Show 6 items per page for department dashboards
  const PAGE_SIZE = 6;
  const toast = useToast();

  // Get total count of documents
  useEffect(() => {
    if (!dept) return;
    const q = query(
      collection(db, "posts"),
      where("departmentTag", "==", dept)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTotalDocs(snap.size);
        setError(null);
      },
      (err) => setError(err.message)
    );
    return () => unsub();
  }, [dept]);

  // Fetch paginated data
  const fetchPage = async (pageNum, cursor = null) => {
    if (!dept) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, "posts"),
        where("departmentTag", "==", dept),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (cursor) {
        q = query(
          collection(db, "posts"),
          where("departmentTag", "==", dept),
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
      toast({
        title: "Error loading posts",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial page
  useEffect(() => {
    fetchPage(1);
  }, [dept]);

  // clamp page when posts change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [posts.length, PAGE_SIZE]);

  useEffect(() => {
    getCurrentPosition()
      .then((p) => {
        setMyLoc(p);
        setLocMsg("Your location loaded");
      })
      .catch(() => {
        setLocMsg("Location not available");
      });
  }, []);

  const counts = useMemo(() => {
    const c = { total: posts.length, pending: 0, in_progress: 0, resolved: 0 };
    posts.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, [posts]);

  const canEdit =
    profile?.role === "admin" ||
    (profile?.role === "dept" && profile?.department === dept);

  const postsWithDistance = useMemo(() => {
    if (!myLoc) return posts;
    return posts.map((p) => {
      const d = distanceKm(myLoc, { lat: p.lat, lng: p.lng });
      return { ...p, distanceKm: typeof d === "number" ? d : undefined };
    });
  }, [posts, myLoc]);

  const handleUpdate = async (postId) => {
    const newStatus = statusMap[postId];
    const actionNote = noteMap[postId] || "";
    if (!newStatus) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        status: newStatus,
        actionNote,
      });
      toast({ title: "Updated", status: "success", duration: 1500 });
      setStatusMap((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };

  return (
    <Container maxW="container.lg" pb={10}>
      {!dept && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          No department resolved from route or profile.
        </Alert>
      )}

      <HStack justify="space-between" mb={4} align="center" wrap="wrap" gap={2}>
        <Heading size="md">{dept || "Dashboard"}</Heading>

        {/* Status summary - centered, labels use gradient text (or purple fallback), counts in black */}
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

      <HStack mb={4} justify="space-between" wrap="wrap" gap={2}>
        <Text fontSize="sm" color="gray.600">
          {locMsg}
        </Text>
        {myLoc && (
          <Text fontSize="sm">
            You: {myLoc.lat.toFixed(4)}, {myLoc.lng.toFixed(4)} ·{" "}
            <Link
              href={googleMapsLink(myLoc.lat, myLoc.lng)}
              isExternal
              color="blue.500"
            >
              Open in Maps
            </Link>
          </Text>
        )}
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {postsWithDistance
          .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
          .map((p) => (
            <Box
              key={p.id}
              borderWidth="1px"
              borderRadius="md"
              overflow="hidden"
              bg="white"
            >
              <PostCard post={p} />
              {canEdit && (
                <VStack align="stretch" spacing={3} p={3}>
                  <Select
                    placeholder="Change status"
                    value={statusMap[p.id] || ""}
                    onChange={(e) =>
                      setStatusMap((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </Select>
                  <Textarea
                    placeholder="Action note (optional)"
                    value={noteMap[p.id] || ""}
                    onChange={(e) =>
                      setNoteMap((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  />
                  <Button colorScheme="blue" onClick={() => handleUpdate(p.id)}>
                    Save
                  </Button>
                </VStack>
              )}
            </Box>
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
            isDisabled={page === Math.ceil(totalDocs / PAGE_SIZE) || isLoading}
          >
            Next
          </Button>
        </HStack>
      )}

      {isLoading && (
        <Box textAlign="center" mt={4}>
          <Text color="gray.500">Loading...</Text>
        </Box>
      )}
    </Container>
  );
}
