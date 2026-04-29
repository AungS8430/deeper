// Sample TypeScript code demonstrating various concepts

interface User {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    role: 'admin' | 'user' | 'moderator';
    phoneNumber?: string;
    address?: string;
    lastLogin?: Date;
    active: boolean;
}

class UserManager {
    private users: User[] = [];
    private nextId: number = 1;

    addUser(name: string, email: string): User {
        const user: User = {
            id: this.nextId++,
            name,
            email,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'user',
            active: true,
        };
        this.users.push(user);
        return user;
    }

    getUser(id: number): User | undefined {
        return this.users.find((u) => u.id === id);
    }

    getAllUsers(): User[] {
        return [...this.users];
    }

    updateUser(id: number, updates: Partial<User>): User | undefined {
        const user = this.getUser(id);
        if (user) {
            Object.assign(user, updates);
        }
        return user;
    }

    deleteUser(id: number): boolean {
        const index = this.users.findIndex((u) => u.id === id);
        if (index > -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }
}

async function fetchUserData(userId: number): Promise<User | null> {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Example usage
const manager = new UserManager();
manager.addUser("John Doe", "john@example.com");
manager.addUser("Jane Smith", "jane@example.com");

console.log(manager.getAllUsers());