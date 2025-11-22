export class AuthResponseDto {
    access_token: string;
    user: {
        id: number;
        fullName: string;
        email: string;
        balance: number;
    };
}