import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Best-first branch-and-bound TSP. Priority = lower bound first; tie-break by longer path.
 */
public class TSPSolver {
    private final Graph graph;

    public TSPSolver(Graph graph) {
        this.graph = graph;
    }

    public Result solve() {
        int n = graph.size();
        PriorityQueue<Node> pq = new PriorityQueue<>((a, b) -> {
            int c = Integer.compare(a.bound, b.bound);
            return c != 0 ? c : Integer.compare(b.path.size(), a.path.size());
        });
        List<Integer> start = new ArrayList<>();
        start.add(0);
        pq.add(new Node(0, 0, start));
        Result best = null;
        while (!pq.isEmpty()) {
            Node cur = pq.poll();
            if (cur.path.size() == n && graph.hasEdge(cur.last(), 0)) {
                int cost = cur.cost + graph.cost(cur.last(), 0);
                if (best == null || cost < best.cost)
                    best = new Result(formatTour(cur.path), cost);
            }
            for (int i = 0; i < n; i++) {
                if (cur.path.contains(i) || !graph.hasEdge(cur.last(), i)) continue;
                int newCost = cur.cost + graph.cost(cur.last(), i);
                int bound = newCost + lowerBound(cur.path.size() + 1);
                if (best != null && bound >= best.cost) continue;
                List<Integer> newPath = new ArrayList<>(cur.path);
                newPath.add(i);
                pq.add(new Node(newCost, bound, newPath));
            }
        }
        return best;
    }

    private int lowerBound(int visited) { return 0; }
    private String formatTour(List<Integer> path) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) sb.append(" – ");
            sb.append("V").append(path.get(i) + 1);
        }
        sb.append(" – V1");
        return sb.toString();
    }

    private static class Node {
        final int cost, bound;
        final List<Integer> path;
        Node(int cost, int bound, List<Integer> path) {
            this.cost = cost; this.bound = bound; this.path = path;
        }
        int last() { return path.get(path.size() - 1); }
    }
    public static class Result {
        public final String tour; public final int cost;
        public Result(String tour, int cost) { this.tour = tour; this.cost = cost; }
    }
}
