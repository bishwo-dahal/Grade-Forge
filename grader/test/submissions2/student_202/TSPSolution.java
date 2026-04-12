import javax.swing.JFileChooser;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

/**
 * TSP in one file - INTENTIONALLY similar to student_201 for plagiarism detection test.
 * Same algorithm and structure as 201's Main+Graph+TSPSolver.
 */
public class TSPSolution {

    public static void main(String[] args) throws IOException {
        JFileChooser chooser = new JFileChooser();
        if (chooser.showOpenDialog(null) != JFileChooser.APPROVE_OPTION)
            return;
        File f = chooser.getSelectedFile();
        Graph g = Graph.fromCSV(f.getPath());
        TSPSolver solver = new TSPSolver(g);
        Result r = solver.solve();
        System.out.println(r.tour);
        System.out.println("Total tour: " + r.cost);
    }

    /** Same as student_201's Graph - for plagiarism test. */
    static class Graph {
        private final int[][] matrix;
        private final int n;

        Graph(int[][] matrix) {
            this.matrix = matrix;
            this.n = matrix.length;
        }

        static Graph fromCSV(String path) throws IOException {
            List<int[]> rows = new ArrayList<>();
            for (String line : Files.readAllLines(Paths.get(path))) {
                String[] parts = line.trim().split(",");
                int[] row = new int[parts.length];
                for (int i = 0; i < parts.length; i++)
                    row[i] = Integer.parseInt(parts[i].trim());
                rows.add(row);
            }
            return new Graph(rows.toArray(new int[0][]));
        }

        int size() { return n; }
        int cost(int i, int j) { return matrix[i][j]; }
        boolean hasEdge(int i, int j) { return matrix[i][j] >= 0; }
    }

    /** Copy of student_201's TSPSolver logic - intentional plagiarism for testing. */
    static class TSPSolver {
        private final Graph graph;

        TSPSolver(Graph graph) { this.graph = graph; }

        Result solve() {
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
    }

    static class Result {
        final String tour;
        final int cost;
        Result(String tour, int cost) { this.tour = tour; this.cost = cost; }
    }
}
