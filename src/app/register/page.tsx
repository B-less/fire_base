
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, set, get, child } from "firebase/database";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const trimmedName = name.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedName || !trimmedPhoneNumber) {
      toast({
        title: "Registration Failed",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (country.pattern && !country.pattern.test(trimmedPhoneNumber)) {
        toast({
            title: "Invalid Phone Number",
            description: `Please enter a valid ${country.name} phone number.`,
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${trimmedPhoneNumber}`;
    
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${fullPhoneNumber}`));

      if (snapshot.exists()) {
        toast({
          title: "Registration Failed",
          description: "This phone number is already registered.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      await set(ref(db, 'users/' + fullPhoneNumber), {
        name: trimmedName,
        phoneNumber: fullPhoneNumber,
      });

      toast({
        title: "Registration Successful",
        description: "You can now log in with your phone number.",
      });

      router.push('/login');

    } catch (error) {
       toast({
          title: "Error",
          description: "An error occurred during registration. Please try again.",
          variant: "destructive",
        })
        console.error(error);
    } finally {
        setIsLoading(false);
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
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join ChirpChat to connect with your friends.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
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
            <Button type="submit" className="w-full" disabled={!name.trim() || !phoneNumber.trim() || isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
        </CardFooter>
      </Card>
    </main>
  );
}
