import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TrueNews } from "../target/types/true_news";
import  * as asert from "assert";
import {assert} from "chai";

describe("true_news", () => {

    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.TrueNews as Program<TrueNews>;

    it("can publish a new news", async () => {
        const newsKeyPair = anchor.web3.Keypair.generate();

        await program.methods
          .publishNews("agasy got retirement", "andrey agasy got retired from us open")
          .accounts({
            myNews: newsKeyPair.publicKey,
            publisherOfNews: program.provider.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newsKeyPair])
          .rpc();

        const newsAccount = await program.account.news.fetch(newsKeyPair.publicKey);
        assert.equal(newsAccount.channel.toBase58(), program.provider.publicKey.toBase58());
        assert.equal(newsAccount.headline,"agasy got retirement");
        assert.equal(newsAccount.news, "andrey agasy got retired from us open");
    });

    
    it("publish a news without headline", async () => {
        const newsKeyPair = anchor.web3.Keypair.generate();    

        await program.methods
            .publishNews("", "olympic game has started")
            .accounts({
                myNews: newsKeyPair.publicKey,
                publisherOfNews: program.provider.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([newsKeyPair])
            .rpc();

        const newsAccount = await program.account.news.fetch(newsKeyPair.publicKey)
        assert.equal(newsAccount.channel.toBase58(), program.provider.publicKey.toBase58())
        assert.equal(newsAccount.headline, "");
        assert.equal(newsAccount.news, "olympic game has started");
    });

    it("publish news with a new channel", async () => {
        const zeeNewsChannel = anchor.web3.Keypair.generate(); 
        const newsKeyPair = anchor.web3.Keypair.generate();

        const signature = await program.provider.connection.requestAirdrop(zeeNewsChannel.publicKey, 1000000000);
        const latestBlockHash = await program.provider.connection.getLatestBlockhash();

        await program.provider.connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: signature,
        });


        await program
            .methods
            .publishNews("schools closed", "Due to winter governement has announced holiday")
            .accounts({
                myNews: newsKeyPair.publicKey,
                publisherOfNews: zeeNewsChannel.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId, 
            })
            .signers([zeeNewsChannel, newsKeyPair])
            .rpc();

        const newsAccount = await program.account.news.fetch(newsKeyPair.publicKey);
        assert.equal(newsAccount.channel.toBase58(), zeeNewsChannel.publicKey.toBase58());

    })

    it("can publish a news with the healine of more than 50 characters", async () => {
        const newsKeyPair = anchor.web3.Keypair.generate();   

        try {
            await program
                .methods
                .publishNews("heading is too long".repeat(50), "this is a long article")
                .accounts({
                    myNews: newsKeyPair.publicKey,
                    publisherOfNews: program.provider.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([newsKeyPair])        
                .rpc();
                
            const newsAccount = await program.account.news.fetch(newsKeyPair.publicKey);
            assert.equal(newsAccount.channel.toBase58(), program.provider.publicKey.toBase58());
        }
        catch(error) {
            assert.ok("it failed , hence test passed");
            return;
        }

        assert.fail("test should have failed because because heading is too long")
    });

    it("can fetch all news", async () => {
        const allNews = await program.account.news.all();
        console.log(allNews);
    })

    it("it can filter news based on channel", async () => {
        const channelPublicKey = program.provider.publicKey;
        const newsAccount = await program.account.news.all([
            {
                memcmp: {
                    offset: 8,
                    bytes: channelPublicKey.toBase58(),
                }
            }
        ]);
        console.log("and the filtered news is \/", newsAccount);
    });

});

