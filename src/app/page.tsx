"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Shirt, UploadCloud, Download, Sparkles, Loader2, X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { generateTryOnImage } from "@/ai/flows/generate-try-on-image";
import { suggestMatchingOutfits } from "@/ai/flows/suggest-matching-outfits";
import { Header } from "@/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PhotoState = {
  file: File | null;
  dataUri: string | null;
};

export default function StyleStudioPage() {
  const [userPhoto, setUserPhoto] = useState<PhotoState>({ file: null, dataUri: null });
  const [clothingPhoto, setClothingPhoto] = useState<PhotoState>({ file: null, dataUri: null });
  const [generatedPhoto, setGeneratedPhoto] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isLoadingTryOn, setIsLoadingTryOn] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { toast } = useToast();

  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  const clothingPhotoInputRef = useRef<HTMLInputElement>(null);

  const toDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'clothing') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUri = await toDataUri(file);
      if (type === 'user') {
        setUserPhoto({ file, dataUri });
      } else {
        setClothingPhoto({ file, dataUri });
        setSuggestions([]);
        setIsLoadingSuggestions(true);
        setApiError(null);
        try {
          const result = await suggestMatchingOutfits({ clothingDataUri: dataUri });
          setSuggestions(result.suggestions);
        } catch (error: any) {
          console.error("Error getting style suggestions:", error);
          if (error.message?.includes('429')) {
            setApiError("You've exceeded the API quota. Please set up a Firebase project to use your own API key.");
          }
          toast({ variant: "destructive", title: "Style Suggestion Failed", description: "Could not get style suggestions. Please try another image." });
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({ variant: "destructive", title: "File Error", description: "There was an error processing your image." });
    }
  }, [toast]);

  const handleGenerate = async () => {
    if (!userPhoto.dataUri || !clothingPhoto.dataUri) {
      toast({ variant: "destructive", title: "Missing Images", description: "Please upload both your photo and a clothing item." });
      return;
    }

    setIsLoadingTryOn(true);
    setGeneratedPhoto(null);
    setApiError(null);
    try {
      const result = await generateTryOnImage({
        userPhotoDataUri: userPhoto.dataUri,
        clothingImageDataUri: clothingPhoto.dataUri,
      });
      setGeneratedPhoto(result.tryOnImageDataUri);
    } catch (error: any) {
      console.error("Error generating try-on image:", error);
      if (error.message?.includes('429')) {
        setApiError("You've exceeded the API quota. Please set up a Firebase project to use your own API key.");
      }
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the try-on image. Please try again." });
    } finally {
      setIsLoadingTryOn(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedPhoto) return;
    const link = document.createElement('a');
    link.href = generatedPhoto;
    link.download = 'style-studio-ai-try-on.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = (type: 'user' | 'clothing' | 'all') => {
    if (type === 'user' || type === 'all') {
      setUserPhoto({ file: null, dataUri: null });
      if(userPhotoInputRef.current) userPhotoInputRef.current.value = "";
    }
    if (type === 'clothing' || type === 'all') {
      setClothingPhoto({ file: null, dataUri: null });
      setSuggestions([]);
      if(clothingPhotoInputRef.current) clothingPhotoInputRef.current.value = "";
    }
    if(type === 'all') {
      setGeneratedPhoto(null);
    }
    setApiError(null);
  };
  
  const handleGetFirebaseProject = () => {
    // This will be handled by the tool
    console.log("Requesting Firebase project...");
  };

  const UploadBox = ({
    photoUri,
    onUploadClick,
    onClearClick,
    Icon,
    title,
    description
  }: {
    photoUri: string | null;
    onUploadClick: () => void;
    onClearClick: () => void;
    Icon: React.ElementType;
    title: string;
    description: string;
  }) => (
    <div className="relative aspect-[4/5] w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-card">
      {photoUri ? (
        <>
          <Image src={photoUri} alt={title} fill className="object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full" onClick={onClearClick}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="text-center p-4 cursor-pointer" onClick={onUploadClick}>
          <div className="flex justify-center items-center h-16 w-16 rounded-full bg-muted mx-auto mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>API Quota Exceeded</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                {apiError}
                <Button onClick={handleGetFirebaseProject}>Get Firebase Project</Button>
              </AlertDescription>
            </Alert>
          )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Camera/>1. Your Photo</CardTitle>
              <CardDescription>Upload a clear, front-facing photo of yourself.</CardDescription>
            </CardHeader>
            <CardContent>
              <input type="file" ref={userPhotoInputRef} onChange={(e) => handleFileSelect(e, 'user')} accept="image/*" className="hidden" />
              <UploadBox
                photoUri={userPhoto.dataUri}
                onUploadClick={() => userPhotoInputRef.current?.click()}
                onClearClick={() => handleReset('user')}
                Icon={UploadCloud}
                title="Upload Your Photo"
                description="Click to select an image"
              />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shirt />2. Your Clothing</CardTitle>
              <CardDescription>Upload an image of a clothing item.</CardDescription>
            </CardHeader>
            <CardContent>
              <input type="file" ref={clothingPhotoInputRef} onChange={(e) => handleFileSelect(e, 'clothing')} accept="image/*" className="hidden" />
               <UploadBox
                photoUri={clothingPhoto.dataUri}
                onUploadClick={() => clothingPhotoInputRef.current?.click()}
                onClearClick={() => handleReset('clothing')}
                Icon={UploadCloud}
                title="Upload Clothing"
                description="Or scan a QR code"
              />
              <Button variant="outline" className="w-full mt-4" disabled>
                <QrCode className="mr-2 h-4 w-4" /> Scan QR Code (Coming Soon)
              </Button>

              { (isLoadingSuggestions || suggestions.length > 0) &&
                <div className="mt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="text-primary"/>Style Suggestions</h3>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                    {isLoadingSuggestions ? (
                      <>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[80%]" />
                        <Skeleton className="h-4 w-full" />
                      </>
                    ) : (
                      <ul className="list-disc list-inside space-y-2">
                        {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              }
            </CardContent>
          </Card>

          <Card className="w-full lg:sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" />3. Your New Look</CardTitle>
              <CardDescription>See the magic happen! Your virtual try-on will appear below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[4/5] w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-card">
                {isLoadingTryOn ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p>Creating your new look...</p>
                    </div>
                ) : generatedPhoto ? (
                  <Image src={generatedPhoto} alt="Generated try-on" fill className="object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Your result will be shown here.</p>
                  </div>
                )}
              </div>
              
              {!generatedPhoto ? (
                <Button onClick={handleGenerate} disabled={!userPhoto.dataUri || !clothingPhoto.dataUri || isLoadingTryOn} className="w-full mt-4">
                  {isLoadingTryOn ? <Loader2 className="animate-spin" /> : "Generate"}
                </Button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button onClick={() => handleReset('all')}>
                    Try Another
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
