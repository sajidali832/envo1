import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const testimonials = [
  {
    name: "Ali Khan",
    review: "Amazing platform! Started earning from day one. Highly recommended.",
    rating: 5,
    avatar: "AK",
  },
  {
    name: "Fatima Ahmed",
    review: "The withdrawal process is so smooth. I got my earnings in my Easypaisa account within hours.",
    rating: 5,
    avatar: "FA",
  },
  {
    name: "Bilal Malik",
    review: "Finally, a trustworthy investment platform in Pakistan. The daily returns are consistent.",
    rating: 5,
    avatar: "BM",
  },
  {
    name: "Ayesha Hussain",
    review: "I was skeptical at first, but EnvoEarn proved me wrong. Great customer support too!",
    rating: 4,
    avatar: "AH",
  },
  {
    name: "Usman Tariq",
    review: "The referral bonus is a great incentive. I've already earned extra by inviting my friends.",
    rating: 5,
    avatar: "UT",
  },
  {
    name: "Sana Jaffery",
    review: "Simple to use and very transparent. I love the daily earnings history feature.",
    rating: 5,
    avatar: "SJ",
  },
  {
    name: "Imran Raza",
    review: "A solid platform for passive income. The 6000 PKR investment is well worth it.",
    rating: 4,
    avatar: "IR",
  },
  {
    name: "Zoya Chishti",
    review: "I appreciate the clear instructions and the quick approval process. Very professional.",
    rating: 5,
    avatar: "ZC",
  },
];


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-headline font-bold text-primary">ENVO-EARN</h1>
        <Link href="/signin">
          <Button variant="ghost">Sign In</Button>
        </Link>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-headline font-bold mb-4 text-gray-800">
            Invest 6000 PKR, Earn 200 PKR Daily.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join ENVO-EARN today and start your journey towards financial growth. A secure and transparent platform for daily earnings.
          </p>
          <Link href="/invest">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 py-6 rounded-full shadow-lg transition-transform transform hover:scale-105">
              Invest 6000
            </Button>
          </Link>
        </section>

        {/* Testimonials Section */}
        <section className="bg-secondary py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-headline font-bold text-center mb-12">
              Trusted by Hundreds of Pakistanis
            </h3>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-5xl mx-auto"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <Card className="h-full flex flex-col justify-between p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div>
                          <div className="flex items-center mb-4">
                            <Avatar>
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${testimonial.avatar}`} alt={testimonial.name} />
                              <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <p className="font-bold font-headline">{testimonial.name}</p>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-0">
                            <p className="text-muted-foreground">{testimonial.review}</p>
                          </CardContent>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ENVO-EARN. All rights reserved.</p>
      </footer>
    </div>
  );
}
