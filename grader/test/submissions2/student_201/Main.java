import javax.swing.JFileChooser;
import java.io.File;
import java.io.IOException;

/**
 * Main entry for TSP solver. Uses file chooser to select adjacency matrix CSV.
 */
public class Main {
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
}
