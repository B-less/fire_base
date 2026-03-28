
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendOtp, verifyOtp } from '@/ai/flows/otp-flow';
import { ChirpChatLogo } from '@/components/chirpchat-logo';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type LoginStep = 'phone' | 'otp';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedPhoneNumber) {
        toast({ title: "Phone Number Required", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    // Validate phone number against country pattern
    if (country.pattern && !country.pattern.test(trimmedPhoneNumber)) {
        toast({ 
            title: "Invalid Phone Number", 
            description: `Please enter a valid ${country.name} phone number.`,
            variant: "destructive" 
        });
        setIsLoading(false);
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${trimmedPhoneNumber}`;

    try {
        const result = await sendOtp({ phoneNumber: fullPhoneNumber });
        if (result.success) {
            toast({ title: "OTP Sent", description: "A verification code has been sent to your phone." });
            setStep('otp');
        } else {
            toast({ title: "Failed to Send OTP", description: result.message, variant: "destructive" });
        }
    } catch (error: unknown) {
        toast({ title: "Error", description: getErrorMessage(error, "An unknown error occurred."), variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length !== 6) {
        toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${phoneNumber.trim()}`;
    
    try {
      const result = await verifyOtp({ phoneNumber: fullPhoneNumber, otp });

      if (result.success && result.user && result.sessionToken) {
        if (result.customToken) {
          try {
            await signInWithCustomToken(auth, result.customToken);
          } catch (firebaseAuthError) {
            console.warn('Firebase Auth sign-in failed after OTP verification.', firebaseAuthError);
          }
        }
        toast({ title: "Login Successful", description: "Welcome to ChirpChat!" });
        login(result.user.phoneNumber, result.user.name, result.sessionToken);
        
        if (result.isNewUser) {
          router.push('/profile-setup');
        } else {
          router.push('/');
        }
      } else {
        toast({ title: "Login Failed", description: result.message, variant: "destructive" });
      }
    } catch (error: unknown) {
       toast({ title: "Error", description: getErrorMessage(error, "An error occurred during verification."), variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    setStep('phone');
    setOtp('');
  }

  const renderPhoneStep = () => (
    <form onSubmit={handleSendOtp} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Sending Code...' : 'Send Code'}
        </Button>
    </form>
  );

  const renderOtpStep = () => (
     <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                className="text-center text-lg tracking-[0.5em]"
            />
        </div>
        <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </Button>
            <Button variant="link" size="sm" onClick={handleBack} className="text-muted-foreground">
                Back
            </Button>
        </div>
    </form>
  );

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
             <ChirpChatLogo className="max-w-[210px]" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Welcome!' : 'Enter Code'}
            </CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Sign in or create an account with your phone number.' : `We sent a code to ${country.dial_code}${phoneNumber}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {step === 'phone' ? renderPhoneStep() : renderOtpStep()}
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-xs text-center text-muted-foreground pt-4">
             <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
