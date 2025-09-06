
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (country.pattern && !country.pattern.test(trimmedPhoneNumber)) {
        toast({
            title: "Invalid Phone Number",
            description: `Please enter a valid ${country.name} phone number.`,
            variant: "destructive",
        });
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${trimmedPhoneNumber}`;
    
    try {
      const users = JSON.parse(localStorage.getItem('chirpchat_users') || '[]');
      const userExists = users.some((user: any) => user.phoneNumber === fullPhoneNumber);

      if (trimmedPhoneNumber && userExists) {
        login(fullPhoneNumber);
        router.push('/');
      } else {
        toast({
          title: "Login Failed",
          description: "This phone number is not registered. Please sign up first.",
          variant: "destructive",
        })
      }
    } catch (error) {
       toast({
          title: "Error",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        })
    }
  };

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Flame className="h-8 w-8 text-primary-foreground" />
             </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Sign in with your phone number to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                 <Select value={country.code} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.dial_code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name} ({c.dial_code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!phoneNumber.trim()}>
              Sign In
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex-col items-center justify-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </p>
        </CardFooter>
      </Card>
    </main>
  );
}
