import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Graph representation from adjacency matrix CSV. -1 means no edge.
 */
public class Graph {
    private final int[][] matrix;
    private final int n;

    public Graph(int[][] matrix) {
        this.matrix = matrix;
        this.n = matrix.length;
    }

    public static Graph fromCSV(String path) throws IOException {
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

    public int size() { return n; }
    public int cost(int i, int j) { return matrix[i][j]; }
    public boolean hasEdge(int i, int j) { return matrix[i][j] >= 0; }
}
