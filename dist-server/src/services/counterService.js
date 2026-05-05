export const counterService = {
    fetchCounts: async () => {
        try {
            const res = await fetch("/api/stats");
            if (res.ok) {
                const data = await res.json();
                // Time saved logic (3 mins per generated prompt approx)
                const totalTimeSaved = data.totalPrompts * 3;
                const stats = {
                    totalPrompts: data.totalPrompts,
                    totalUsers: data.totalUsers,
                    totalTimeSaved,
                    lastUpdated: Date.now()
                };
                localStorage.setItem("GLOBAL_STATS", JSON.stringify(stats));
                window.dispatchEvent(new Event("statsUpdated"));
                return stats;
            }
        }
        catch (e) {
            console.error(e);
        }
        return counterService.getCounts();
    },
    getCounts: () => {
        try {
            let statsStr = localStorage.getItem("GLOBAL_STATS");
            if (statsStr) {
                const parsed = JSON.parse(statsStr);
                if (typeof parsed.totalPrompts !== 'number' || isNaN(parsed.totalPrompts) ||
                    typeof parsed.totalUsers !== 'number' || isNaN(parsed.totalUsers)) {
                    return { totalPrompts: 110, totalUsers: 15, totalTimeSaved: 330, lastUpdated: Date.now() };
                }
                return parsed;
            }
            return { totalPrompts: 110, totalUsers: 15, totalTimeSaved: 330, lastUpdated: Date.now() };
        }
        catch {
            return { totalPrompts: 110, totalUsers: 15, totalTimeSaved: 330, lastUpdated: Date.now() };
        }
    },
    incrementPrompt: () => {
        counterService.fetchCounts();
        return counterService.getCounts().totalPrompts + 1;
    },
    incrementUserOnce: () => {
        counterService.fetchCounts();
        return counterService.getCounts().totalUsers;
    }
};
