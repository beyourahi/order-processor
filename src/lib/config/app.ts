interface AppConfig {
    name: string;
    description: string;
    url: string;
    repository: { type: string; url: string };
    author: { name: string; url: string };
    siblings: Array<{ name: string; url: string }>;
}

export const APP_CONFIG: AppConfig = {
    name: "Order Processor",
    description: "Process and format orders for multiple courier services",
    url: "https://order-processor.beyourahi.workers.dev",
    repository: {
        type: "git",
        url: "https://github.com/beyourahi/order-processor"
    },
    author: {
        name: "Rahi Khan",
        url: "https://beyourahi.com"
    },
    siblings: [
        {
            name: "Invoice Generator",
            url: "https://invoice-generator.beyourahi.workers.dev"
        }
    ]
};
