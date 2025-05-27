const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL;
};

export async function getRoles() {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/role/list-not-admin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      
      console.log("Roles response status:", response.status);
      const data = await response.json();
      return data.map((role) => ({
        title: role.name,
        value: role.id,
      }));
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  }
