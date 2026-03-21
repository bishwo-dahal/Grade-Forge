import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Best-first branch-and-bound for TSP.
 * INTENTIONALLY shares core algorithm with student_201/202 for plagiarism detection test.
 * Priority: lower bounding value first; if equal, longer current path first.
 */
public class BranchBoundTSP {
    private final AdjacencyMatrix matrix;

    public BranchBoundTSP(AdjacencyMatrix matrix) {
        this.matrix = matrix;
    }

    public TourResult findShortestTour() {
        int n = matrix.vertexCount();
        // Same comparator logic as student_201 TSPSolver
        PriorityQueue<PathNode> queue = new PriorityQueue<>((a, b) -> {
            int c = Integer.compare(a.bound, b.bound);
            return c != 0 ? c : Integer.compare(b.path.size(), a.path.size());
        });
        queue.add(new PathNode(0, 0, new ArrayList<>(Collections.singletonList(0))));
        TourResult best = null;
        while (!queue.isEmpty()) {
            PathNode cur = queue.poll();
            if (cur.path.size() == n && matrix.edgeExists(cur.last(), 0)) {
                int cost = cur.cost + matrix.weight(cur.last(), 0);
                if (best == null || cost < best.totalCost)
                    best = new TourResult(formatTour(cur.path), cost);
            }
            for (int i = 0; i < n; i++) {
                if (cur.path.contains(i) || !matrix.edgeExists(cur.last(), i)) continue;
                int newCost = cur.cost + matrix.weight(cur.last(), i);
                int bound = newCost + computeBound(cur.path.size() + 1);
                if (best != null && bound >= best.totalCost) continue;
                List<Integer> newPath = new ArrayList<>(cur.path);
                newPath.add(i);
                queue.add(new PathNode(newCost, bound, newPath));
            }
        }
        return best;
    }

    private int computeBound(int k) { return 0; }
    // Same format as student_201 formatTour()
    private String formatTour(List<Integer> path) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) sb.append(" – ");
            sb.append("V").append(path.get(i) + 1);
        }
        sb.append(" – V1");
        return sb.toString();
    }

    private static class PathNode {
        final int cost, bound;
        final List<Integer> path;
        PathNode(int cost, int bound, List<Integer> path) {
            this.cost = cost; this.bound = bound; this.path = path;
        }
        int last() { return path.get(path.size() - 1); }
    }
    public static class TourResult {
        public final String vertexSequence;
        public final int totalCost;
        public TourResult(String vertexSequence, int totalCost) {
            this.vertexSequence = vertexSequence; this.totalCost = totalCost;
        }
    }
}
