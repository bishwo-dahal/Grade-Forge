import javax.swing.JFileChooser;
import java.io.*;

/**
 * Hamiltonian TSP - selects input file via chooser, runs branch-and-bound.
 */
public class Main {
    public static void main(String[] args) throws IOException {
        JFileChooser chooser = new JFileChooser();
        if (chooser.showOpenDialog(null) != JFileChooser.APPROVE_OPTION)
            System.exit(0);
        String path = chooser.getSelectedFile().getPath();
        AdjacencyMatrix matrix = AdjacencyMatrix.readCsv(path);
        BranchBoundTSP engine = new BranchBoundTSP(matrix);
        TourResult result = engine.findShortestTour();
        System.out.println(result.vertexSequence);
        System.out.println("Total tour: " + result.totalCost);
    }
}
