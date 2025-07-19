import { NextRequest, NextResponse } from "next/server";

interface VSCodeMarketplaceResponse {
  results: Array<{
    extensions: Array<{
      extensionId: string;
      extensionName: string;
      displayName: string;
      shortDescription: string;
      publisher: {
        publisherName: string;
        displayName: string;
      };
      versions: Array<{
        version: string;
        lastUpdated: string;
      }>;
      statistics: Array<{
        statisticName: string;
        value: number;
      }>;
      categories: string[];
      tags: string[];
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sortBy = searchParams.get("sortBy") || "installs";
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") || "20"),
    100
  );

  try {
    // Call VS Code Marketplace API
    const response = await fetch(
      "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json;api-version=3.0-preview.1",
          "User-Agent": "AlphaCode-Extension-Browser",
        },
        body: JSON.stringify({
          filters: [
            {
              criteria: [
                {
                  filterType: 8, // Category
                  value: category || "Programming Languages",
                },
                {
                  filterType: 10, // Target (VS Code)
                  value: "Microsoft.VisualStudio.Code",
                },
                {
                  filterType: 12, // ExcludeWithFlags
                  value: "4096", // Exclude preview versions
                },
              ].concat(
                query
                  ? [
                      {
                        filterType: 23, // SearchText
                        value: query,
                      },
                    ]
                  : []
              ),
              pageNumber: 1,
              pageSize: pageSize,
              sortBy: sortBy === "installs" ? 4 : sortBy === "rating" ? 12 : 10, // InstallCount, WeightedRating, PublishedDate
              sortOrder: 2, // Descending
            },
          ],
          flags: 914, // Include files, statistics, versions, etc.
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Marketplace API error: ${response.status}`);
    }

    const data: VSCodeMarketplaceResponse = await response.json();

    // Transform the response to our format
    const extensions =
      data.results[0]?.extensions?.map((ext) => {
        const installStat = ext.statistics.find(
          (s) => s.statisticName === "install"
        );
        const ratingStat = ext.statistics.find(
          (s) => s.statisticName === "averagerating"
        );

        return {
          id: `${ext.publisher.publisherName}.${ext.extensionName}`,
          name: ext.extensionName,
          displayName: ext.displayName,
          publisher: ext.publisher,
          versions: ext.versions,
          statistics: ext.statistics,
          shortDescription: ext.shortDescription,
          categories: ext.categories || [],
          tags: ext.tags || [],
          installCount: installStat?.value || 0,
          rating: ratingStat?.value || 0,
          isInstalled: false, // This would be determined by checking local storage or server state
          isEnabled: false,
        };
      }) || [];

    return NextResponse.json({
      extensions,
      totalCount: extensions.length,
    });
  } catch (error) {
    console.error("Error fetching extensions:", error);

    // Fallback to mock data if API fails
    const mockExtensions = [
      {
        id: "ms-python.python",
        name: "python",
        displayName: "Python",
        publisher: {
          publisherName: "ms-python",
          displayName: "Microsoft",
        },
        versions: [
          {
            version: "2024.8.0",
            lastUpdated: "2024-07-15T00:00:00Z",
          },
        ],
        statistics: [
          { statisticName: "install", value: 85234567 },
          { statisticName: "averagerating", value: 4.5 },
        ],
        shortDescription:
          "IntelliSense (Pylance), Linting, Debugging, Jupyter Notebooks, code formatting, refactoring, unit tests, and more.",
        categories: ["Programming Languages", "Debuggers", "Formatters"],
        tags: ["python", "intellisense", "pylance", "jupyter"],
        installCount: 85234567,
        rating: 4.5,
        isInstalled: false,
        isEnabled: false,
      },
      {
        id: "esbenp.prettier-vscode",
        name: "prettier-vscode",
        displayName: "Prettier - Code formatter",
        publisher: {
          publisherName: "esbenp",
          displayName: "Prettier",
        },
        versions: [
          {
            version: "10.4.0",
            lastUpdated: "2024-07-10T00:00:00Z",
          },
        ],
        statistics: [
          { statisticName: "install", value: 38567234 },
          { statisticName: "averagerating", value: 4.3 },
        ],
        shortDescription: "Code formatter using prettier",
        categories: ["Formatters"],
        tags: ["formatter", "prettier", "javascript", "typescript"],
        installCount: 38567234,
        rating: 4.3,
        isInstalled: false,
        isEnabled: false,
      },
    ];

    const filteredMockExtensions = query
      ? mockExtensions.filter(
          (ext) =>
            ext.displayName.toLowerCase().includes(query.toLowerCase()) ||
            ext.shortDescription.toLowerCase().includes(query.toLowerCase())
        )
      : mockExtensions;

    return NextResponse.json({
      extensions: filteredMockExtensions,
      totalCount: filteredMockExtensions.length,
      fallback: true,
    });
  }
}

// Handle extension installation
export async function POST(request: NextRequest) {
  try {
    const { extensionId, action } = await request.json();

    if (!extensionId || !action) {
      return NextResponse.json(
        { error: "Extension ID and action are required" },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Download the extension from the marketplace
    // 2. Install it in the user's environment
    // 3. Update the extension state in database/storage

    switch (action) {
      case "install":
        // Simulate installation process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return NextResponse.json({
          success: true,
          message: `Extension ${extensionId} installed successfully`,
        });

      case "uninstall":
        // Simulate uninstallation process
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return NextResponse.json({
          success: true,
          message: `Extension ${extensionId} uninstalled successfully`,
        });

      case "enable":
      case "disable":
        return NextResponse.json({
          success: true,
          message: `Extension ${extensionId} ${action}d successfully`,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Extension action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
