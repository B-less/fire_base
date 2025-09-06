
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = `${country.dial_code}${phoneNumber}`;
    if (phoneNumber.trim()) {
      login(fullPhoneNumber.trim());
      router.push('/');
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
          <CardTitle className="text-2xl">Welcome to ChirpChat</CardTitle>
          <CardDescription>Sign in to continue to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                 <Select value={country.code} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-auto">
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
                  placeholder="Enter your phone number"
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
      </Card>
    </main>
  );
}
