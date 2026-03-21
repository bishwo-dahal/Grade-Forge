import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Reads adjacency matrix from CSV; -1 indicates no edge. */
public class AdjacencyMatrix {
    private final int[][] weights;
    private final int vertices;

    public AdjacencyMatrix(int[][] weights) {
        this.weights = weights;
        this.vertices = weights.length;
    }

    public static AdjacencyMatrix readCsv(String filePath) throws IOException {
        List<int[]> rows = new ArrayList<>();
        for (String line : Files.readAllLines(Paths.get(filePath))) {
            int[] row = Arrays.stream(line.split(","))
                .map(String::trim)
                .mapToInt(Integer::parseInt)
                .toArray();
            rows.add(row);
        }
        return new AdjacencyMatrix(rows.toArray(new int[0][]));
    }

    public int vertexCount() { return vertices; }
    public int weight(int i, int j) { return weights[i][j]; }
    public boolean edgeExists(int i, int j) { return weights[i][j] >= 0; }
}
